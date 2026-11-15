import { NextResponse } from "next/server"
import { formatUnits, isAddress, zeroAddress, type Address } from "viem"
import { getClient, inspectPonsLaunch } from "@/lib/blockchain"

// Read-only check. Launch provenance is verified only when the Pons V2 factory
// returns an existing launch record; ERC-20 metadata alone is not launch proof.
const abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const

// Pons V2 publishes each launch's immutable trading rates on its own curve.
// The poolFee field in the factory launch record is NOT the trading fee.
const ponsCurveFeeAbi = [
  { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "creatorTaxBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const

export async function GET(_request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  if (!isAddress(address)) return NextResponse.json({ error: "Invalid token address" }, { status: 400 })
  try {
    const client = getClient(4663)
    const tokenAddress = address as Address
    const [code, blockNumber] = await Promise.all([
      client.getCode({ address: tokenAddress }),
      client.getBlockNumber(),
    ])
    const deployed = Boolean(code && code !== "0x")
    if (!deployed) return NextResponse.json({ deployed: false, chainId: 4663, blockNumber: Number(blockNumber), checkedAt: new Date().toISOString(), token: null, pons: null }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } })

    const [name, symbol, decimals, supply, pons] = await Promise.all([
      client.readContract({ address: tokenAddress, abi, functionName: "name" }).catch(() => null),
      client.readContract({ address: tokenAddress, abi, functionName: "symbol" }).catch(() => null),
      client.readContract({ address: tokenAddress, abi, functionName: "decimals" }).catch(() => null),
      client.readContract({ address: tokenAddress, abi, functionName: "totalSupply" }).catch(() => null),
      inspectPonsLaunch(tokenAddress, 4663),
    ])
    let tradingFees: { baseFeeBps: number; creatorTaxBps: number; totalFeeBps: number } | null = null
    if (pons?.verified && pons.curve && isAddress(pons.curve) && pons.curve !== zeroAddress) {
      const curveAddress: Address = pons.curve
      // Read the actual immutable launch rates; never guess a default fee.
      const [base, creator] = await Promise.allSettled([
        client.readContract({ address: curveAddress, abi: ponsCurveFeeAbi, functionName: "feeBps" }),
        client.readContract({ address: curveAddress, abi: ponsCurveFeeAbi, functionName: "creatorTaxBps" }),
      ])
      if (base.status === "fulfilled" && creator.status === "fulfilled" && base.value <= BigInt(10000) && creator.value <= BigInt(10000)) {
        const baseFeeBps = Number(base.value)
        const creatorTaxBps = Number(creator.value)
        tradingFees = { baseFeeBps, creatorTaxBps, totalFeeBps: baseFeeBps + creatorTaxBps }
      }
    }
    const validDecimals = decimals !== null && Number(decimals) >= 0 && Number(decimals) <= 36
    const totalSupply = supply !== null && validDecimals ? formatUnits(supply, Number(decimals)) : null
    return NextResponse.json({
      deployed: true, chainId: 4663, blockNumber: Number(blockNumber), checkedAt: new Date().toISOString(),
      token: { name, symbol, decimals: validDecimals ? Number(decimals) : null, totalSupply },
      pons: pons ? { verified: pons.verified, phase: pons.phase, phaseLabel: pons.phaseLabel, poolFee: pons.verified ? pons.poolFee : null, tradingFees, progressPercent: pons.progressPercent, factory: pons.factory } : null,
    }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } })
  } catch {
    return NextResponse.json({ error: "Blockchain data is temporarily unavailable" }, { status: 503 })
  }
}
