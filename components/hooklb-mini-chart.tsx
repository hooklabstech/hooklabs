"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { ExternalLink, RefreshCw, TrendingUp } from "lucide-react"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Unable to load market candles")
  return response.json()
}
type HooklbCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
type HooklbMarketResponse = {
  status: "available" | "unavailable"
  address: string
  interval: string
  source: "Crius" | "GeckoTerminal" | null
  sourceUrl: string
  message?: string
  candles: HooklbCandle[]
  priceUsd?: number
  rangeChangePercent?: number | null
  updatedAt?: number
}

const CHART_PERIODS = ["1m", "5m", "1h", "1d"] as const

function readableUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—"
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
  if (value >= 0.0001) return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`
  return `$${value.toPrecision(4)}`
}

export function HooklbMiniChart({ address }: { address: string }) {
  const validAddress = /^0x[0-9a-fA-F]{40}$/.test(address)
  const [period, setPeriod] = useState<(typeof CHART_PERIODS)[number]>("5m")
  const [chartType, setChartType] = useState<"candles" | "line">("candles")
  const endpoint = validAddress
    ? `/api/hooklb-market?address=${encodeURIComponent(address)}&interval=${period}`
    : null
  const { data, error, isLoading, isValidating, mutate } = useSWR<HooklbMarketResponse>(endpoint, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    keepPreviousData: false,
  })
  const bars = useMemo(() => (data?.address.toLowerCase() === address.toLowerCase() && data.interval === period
    ? data.candles ?? [] : []).filter(bar =>
    Number.isFinite(bar.time) && Number.isFinite(bar.open) && Number.isFinite(bar.high) &&
    Number.isFinite(bar.low) && Number.isFinite(bar.close) && bar.close > 0,
  ), [data, address, period])
  const geometry = useMemo(() => {
    const width = 900, height = 310, left = 12, right = 88, top = 18, priceBottom = 246, volumeBottom = 278
    if (!bars.length) return null
    const minRaw = Math.min(...bars.map(bar => bar.low))
    const maxRaw = Math.max(...bars.map(bar => bar.high))
    const padding = Math.max((maxRaw - minRaw) * 0.12, maxRaw * 0.004)
    const min = Math.max(0, minRaw - padding)
    const max = maxRaw + padding
    const xWidth = width - right - left
    const xAt = (i: number) => left + ((i + 0.5) / bars.length) * xWidth
    const yAt = (price: number) => top + ((max - price) / Math.max(max - min, 1e-20)) * (priceBottom - top)
    const maxVolume = Math.max(1, ...bars.map(bar => bar.volume))
    const candleWidth = Math.max(1, Math.min(14, (xWidth / bars.length) * 0.67))
    const line = bars.map((bar, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(bar.close).toFixed(2)}`).join(" ")
    return { width, height, left, right, top, priceBottom, volumeBottom, min, max, xAt, yAt, maxVolume, candleWidth, line }
  }, [bars])
  const lastPrice = bars.at(-1)?.close ?? null
  const rangeChange = bars.length > 0 && bars[0].open > 0 && lastPrice != null
    ? ((lastPrice - bars[0].open) / bars[0].open) * 100 : null
  const chartLink = validAddress ? `https://ponsfamily.com/launchpad/${address}` : "/token"

  return <div className="relative min-w-0 overflow-hidden rounded-2xl border border-[#1683b8]/55 bg-[linear-gradient(145deg,#071c2a,#050e19_70%)] p-4 shadow-[0_16px_48px_rgba(0,0,0,.22)] sm:p-5"
    aria-label="HOOKLB/WETH token candlestick chart based on configured contract address">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight">
          <TrendingUp className="size-4 shrink-0 text-[#20bdff]" /> HOOKLB<span className="font-normal text-[#92a6b8]">/WETH</span>
        </p>
        <p className="mt-0.5 text-[10px] text-[#8ba5bb]">Robinhood Chain · Ponsfamily · USD price</p>
      </div>
      <div className="min-w-0 text-right">
        <p className="font-mono text-[17px] font-semibold leading-5 tabular-nums text-white">{lastPrice != null ? readableUsd(lastPrice) : "—"}</p>
        {rangeChange != null && <p className={`mt-1 text-[10px] font-medium tabular-nums ${rangeChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {rangeChange >= 0 ? "+" : ""}{rangeChange.toFixed(2)}% <span className="text-[#9aaaba]">shown range</span>
        </p>}
      </div>
    </div>
    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-y border-white/[.07] py-1.5">
      <div className="flex gap-0.5" aria-label="Chart timeframe">
        {CHART_PERIODS.map(value => <button type="button" key={value} onClick={() => setPeriod(value)}
          aria-pressed={period === value}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${period === value ? "bg-[#058bd0] text-white" : "text-[#92a9bc] hover:bg-white/10 hover:text-white"}`}>{value}</button>)}
      </div>
      <div className="flex gap-0.5" aria-label="Chart display style">
        {(["candles", "line"] as const).map(value => <button key={value} type="button" onClick={() => setChartType(value)} aria-pressed={chartType === value}
          className={`rounded-md px-2 py-1 text-[10px] ${chartType === value ? "bg-white/10 text-white" : "text-[#819caf] hover:text-white"}`}>{value === "candles" ? "Candles" : "Line"}</button>)}
      </div>
    </div>
    <div className="relative mt-3 min-h-[260px] sm:min-h-[310px]">
      {geometry && bars.length ? <svg className="h-[260px] w-full sm:h-[310px]" viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none" role="img"
        aria-label={`${bars.length} historical price candles from ${data?.source ?? "market provider"}`}>
        <defs>
          <linearGradient id="hooklbMiniLineGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00baff" stopOpacity=".24"/><stop offset="100%" stopColor="#00baff" stopOpacity="0"/></linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((fraction, i) => {
          const price = geometry.max - (geometry.max - geometry.min) * fraction
          const y = geometry.yAt(price)
          return <g key={i}>
            <line x1={geometry.left} x2={geometry.width - geometry.right + 4} y1={y} y2={y} stroke="#254054" strokeOpacity=".57" strokeDasharray="3 5" />
            <text x={geometry.width - geometry.right + 9} y={y + 3} fill="#8aa6ba" fontSize="10" fontFamily="monospace">{price >= .0001 ? price.toPrecision(3) : price.toExponential(1)}</text>
          </g>
        })}
        {bars.map((bar, index) => {
          const x = geometry.xAt(index)
          const higher = bar.close >= bar.open
          const color = higher ? "#20c99a" : "#f16a77"
          const volumeHeight = (bar.volume / geometry.maxVolume) * 28
          return <g key={bar.time}>
            <rect x={x - geometry.candleWidth / 2} y={geometry.volumeBottom - volumeHeight}
              width={geometry.candleWidth} height={Math.max(0.5, volumeHeight)} fill={color} opacity=".56" />
            {chartType === "candles" && <>
              <line x1={x} y1={geometry.yAt(bar.high)} x2={x} y2={geometry.yAt(bar.low)} stroke={color} strokeWidth="1.05" />
              <rect x={x - geometry.candleWidth / 2} y={Math.min(geometry.yAt(bar.open), geometry.yAt(bar.close))}
                width={geometry.candleWidth} height={Math.max(1.4, Math.abs(geometry.yAt(bar.open) - geometry.yAt(bar.close)))} fill={color} />
            </>}
            <title>{new Date(bar.time).toISOString().slice(0, 16).replace("T", " ")} UTC · O {readableUsd(bar.open)} · H {readableUsd(bar.high)} · L {readableUsd(bar.low)} · C {readableUsd(bar.close)}</title>
          </g>
        })}
        {chartType === "line" && <>
          <path d={`${geometry.line} L${geometry.xAt(bars.length - 1).toFixed(2)},${geometry.priceBottom} L${geometry.xAt(0).toFixed(2)},${geometry.priceBottom} Z`} fill="url(#hooklbMiniLineGradient)" />
          <path d={geometry.line} fill="none" stroke="#14baff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </>}
        {[0, Math.floor((bars.length - 1)/2), bars.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i => <text key={i}
          x={geometry.xAt(i)} y="304" fill="#809daf" fontSize="10" textAnchor={i===0?"start":i===bars.length-1?"end":"middle"}>
          {period === "1d" ? new Date(bars[i].time).toISOString().slice(5,10) : new Date(bars[i].time).toISOString().slice(11,16)}</text>)}
      </svg> : <div className="flex h-[260px] flex-col items-center justify-center gap-2 px-2 text-center text-xs leading-5 text-[#9eb0c0]">
        <span>{!validAddress ? "Chart will be available after token launch." : isLoading || (isValidating && !data) ? "Loading real on-chain candles…" : error ? "Failed to load historical candles." : data?.message ?? "No historical trades available for this contract."}</span>
        {validAddress && !isLoading && <button type="button" onClick={() => void mutate()} className="inline-flex items-center gap-1 text-[#28baff] hover:underline"><RefreshCw className="size-3" /> Retry</button>}
      </div>}
    </div>
    <div className="mt-3 flex justify-end border-t border-white/10 pt-3 text-xs">
      <a href={chartLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#25baff] hover:underline">
        Chart on Pons <ExternalLink className="size-3" />
      </a>
    </div>
  </div>
}
