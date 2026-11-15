import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Robinhood Chain (4663). All prices and candles are derived from the configured token CA.
// Never filter by the site's display ticker: test tokens can have other on-chain symbols.
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const INTERVALS = new Set(["1m", "5m", "1h", "1d"])
const CACHE_SECONDS = 25

type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number }
type CriusPayload = {
  data?: { t?: unknown; o?: unknown; h?: unknown; l?: unknown; c?: unknown; v?: unknown }
  error?: unknown
}
type GeckoPool = {
  attributes?: { address?: string; reserve_in_usd?: string | number | null }
  relationships?: {
    base_token?: { data?: { id?: string } }
    quote_token?: { data?: { id?: string } }
  }
}

const cacheHeaders = { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30` }

function finitePrice(value: unknown): number | null {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN
  return Number.isFinite(number) && number > 0 ? number : null
}

function normalize(time: unknown, open: unknown, high: unknown, low: unknown, close: unknown, volume: unknown): Candle | null {
  const timestamp = Number(time)
  const o = finitePrice(open), h = finitePrice(high), l = finitePrice(low), c = finitePrice(close)
  const v = Number(volume)
  if (![timestamp].every(Number.isFinite) || !o || !h || !l || !c || h < l) return null
  const t = timestamp < 1e12 ? timestamp * 1000 : timestamp
  if (t < 1450000000000 || t > Date.now() + 3600000) return null
  return { time: t, open: o, high: Math.max(h, o, c), low: Math.min(l, o, c), close: c, volume: Number.isFinite(v) && v >= 0 ? v : 0 }
}

function uniqueOrdered(candles: Candle[]): Candle[] {
  const byTime = new Map<number, Candle>()
  for (const candle of candles) byTime.set(candle.time, candle)
  return [...byTime.values()].sort((a, b) => a.time - b.time).slice(-110)
}

async function fromCrius(address: string, interval: string): Promise<Candle[]> {
  const url = new URL(`https://api.crius.sh/v1/robinhood/token/${address}/candles`)
  url.searchParams.set("interval", interval)
  url.searchParams.set("limit", "110")
  url.searchParams.set("fill", "true")
  // USD is what the Pons chart displays. The token/WETH pair name is a UI label.
  url.searchParams.set("currency", "usd")
  const headers: Record<string, string> = { Accept: "application/json" }
  if (process.env.CRIUS_API_KEY) headers["x-api-key"] = process.env.CRIUS_API_KEY
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(8500), next: { revalidate: CACHE_SECONDS } })
  if (!response.ok) throw new Error(`Crius: HTTP ${response.status}`)
  const payload = (await response.json()) as CriusPayload
  const data = payload.data
  if (!data || !Array.isArray(data.t) || !Array.isArray(data.o) || !Array.isArray(data.h) || !Array.isArray(data.l) || !Array.isArray(data.c)) {
    throw new Error("Crius: no candle data")
  }
  const candles: Candle[] = []
  for (let i = 0; i < data.t.length; i++) {
    const candle = normalize(data.t[i], data.o[i], data.h[i], data.l[i], data.c[i], Array.isArray(data.v) ? data.v[i] : 0)
    if (candle) candles.push(candle)
  }
  return uniqueOrdered(candles)
}

// Public fallback for already-indexed DEX pools. Pons bonding-curve tokens
// often need Crius because they have not graduated into an indexed pool yet.
async function fromGeckoTerminal(address: string, interval: string): Promise<Candle[]> {
  const poolResponse = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${address}/pools?page=1`,
    { headers: { Accept: "application/json;version=20230302" }, signal: AbortSignal.timeout(8000), next: { revalidate: 60 } },
  )
  if (!poolResponse.ok) throw new Error(`GeckoTerminal: HTTP ${poolResponse.status}`)
  const poolsBody = (await poolResponse.json()) as { data?: GeckoPool[] }
  const tokenId = `robinhood_${address.toLowerCase()}`
  const pools = (poolsBody.data ?? []).filter(pool => {
    const relation = pool.relationships
    return [relation?.base_token?.data?.id, relation?.quote_token?.data?.id]
      .some(id => id?.toLowerCase() === tokenId)
  })
  const pool = pools.sort((a, b) => Number(b.attributes?.reserve_in_usd ?? 0) - Number(a.attributes?.reserve_in_usd ?? 0))[0]
  const poolAddress = pool?.attributes?.address
  if (!poolAddress || !ADDRESS.test(poolAddress)) return []
  const timeframe = interval === "1d" ? "day" : interval === "1h" ? "hour" : "minute"
  const aggregate = interval === "5m" ? "5" : "1"
  const url = new URL(`https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${poolAddress}/ohlcv/${timeframe}`)
  url.searchParams.set("aggregate", aggregate)
  url.searchParams.set("limit", "110")
  url.searchParams.set("currency", "usd")
  url.searchParams.set("token", address)
  const response = await fetch(url, {
    headers: { Accept: "application/json;version=20230302" }, signal: AbortSignal.timeout(8000), next: { revalidate: CACHE_SECONDS },
  })
  if (!response.ok) throw new Error(`GeckoTerminal candles: HTTP ${response.status}`)
  const payload = (await response.json()) as { data?: { attributes?: { ohlcv_list?: unknown } } }
  const rows = payload.data?.attributes?.ohlcv_list
  if (!Array.isArray(rows)) return []
  const candles: Candle[] = []
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const candle = normalize(row[0], row[1], row[2], row[3], row[4], row[5])
    if (candle) candles.push(candle)
  }
  return uniqueOrdered(candles)
}

export async function GET(request: NextRequest) {
  const address = (request.nextUrl.searchParams.get("address") ?? "").trim()
  const interval = (request.nextUrl.searchParams.get("interval") ?? "5m").trim()
  if (!ADDRESS.test(address) || !INTERVALS.has(interval)) {
    return NextResponse.json({ error: "Invalid token CA or timeframe" }, { status: 400 })
  }

  const sourceUrl = `https://ponsfamily.com/launchpad/${address}`
  let candles: Candle[] = []
  let source: "Crius" | "GeckoTerminal" | null = null
  let providerError = ""

  try {
    candles = await fromCrius(address, interval)
    if (candles.length) source = "Crius"
  } catch (error) {
    providerError = error instanceof Error ? error.message : "OHLCV provider unavailable"
  }

  if (!candles.length) {
    try {
      candles = await fromGeckoTerminal(address, interval)
      if (candles.length) source = "GeckoTerminal"
    } catch (error) {
      if (!providerError) providerError = error instanceof Error ? error.message : "DEX provider unavailable"
    }
  }

  if (!candles.length) {
    return NextResponse.json({
      status: "unavailable", source: null, address, interval, candles: [],
      sourceUrl, message: providerError ? "Historical chart provider is currently unavailable, or this token has no indexed trades." : "No historical trades indexed for this address yet.",
    }, { headers: cacheHeaders })
  }

  const first = candles[0]
  const last = candles[candles.length - 1]
  return NextResponse.json({
    status: "available", address, interval, source, sourceUrl, candles,
    priceUsd: last.close,
    // This compares the visible range only; not a misleading 24h percent.
    rangeChangePercent: first.open > 0 ? ((last.close - first.open) / first.open) * 100 : null,
    updatedAt: last.time,
  }, { headers: cacheHeaders })
}
