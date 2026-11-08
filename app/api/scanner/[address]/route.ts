import { NextResponse } from "next/server"
import { assessRisk, inspectAddress } from "@/lib/blockchain"
import { tackle } from "@/lib/tackle"
import { recordSecurityAssessment } from "@/lib/analytics"

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const chainId = Number(new URL(request.url).searchParams.get("chainId") ?? 1)
  try {
    const inspection = await inspectAddress(address, chainId)
    const response = chainId === 4663 && inspection.isContract ? await tackle.pools({ hook: address, limit: 10 }).catch(() => null) : null
    const relatedPools = (response?.pools ?? []).map((pool) => ({ id: pool.poolId, pair: pool.pair, createdAt: pool.createdAt, createdBlock: pool.createdBlock, txHash: pool.txHash, fee: pool.key?.fee ?? 0, tickSpacing: pool.key?.tickSpacing ?? 0 }))
    const risk = assessRisk({ isContract: inspection.isContract, bytecodeSize: inspection.bytecodeSize, token: inspection.token, permissions: inspection.permissions, pons: inspection.pons, poolCount: relatedPools.length })
    const assessmentStored = await recordSecurityAssessment({ chainId, contractAddress: inspection.address, riskScore: risk.score, riskLevel: risk.level, isContract: inspection.isContract }).catch(() => false)
    return NextResponse.json({ ...inspection, risk, assessmentStored, relatedPools, relatedPoolsTotal: response?.total ?? null, registryProvider: chainId === 4663 ? "tacklehooks.xyz" : null }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed"
    return NextResponse.json({ error: message }, { status: message.includes("Invalid") || message.includes("Unsupported") ? 400 : 502 })
  }
}
