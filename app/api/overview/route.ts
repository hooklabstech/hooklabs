import { NextResponse } from "next/server"
import { getClient, supportedChains } from "@/lib/blockchain"
import { readCheckpoint } from "@/lib/indexer-db"
import { tackle } from "@/lib/tackle"

export async function GET() {
  try {
    const healthPromise = Promise.all(supportedChains.map(async (chain) => {
      const started = Date.now()
      try { const block = await getClient(chain.id).getBlockNumber(); return { chainId: chain.id, name: chain.name, healthy: true, block: Number(block), latencyMs: Date.now() - started } }
      catch { return { chainId: chain.id, name: chain.name, healthy: false, block: null, latencyMs: Date.now() - started } }
    }))
    const [stats, radar, checkpoint, health] = await Promise.all([tackle.stats(), tackle.radar(8), readCheckpoint().catch(() => null), healthPromise])
    const pools24h = radar.pools.filter((pool) => Date.now() - new Date(pool.createdAt).getTime() <= 86400000).length
    return NextResponse.json({ provider: { name: "Tackle Hooks", url: "https://tacklehooks.xyz", chainId: stats.chain.id, chainName: stats.chain.name }, index: stats.index, rpc: { configured: supportedChains.length, healthy: health.filter((item) => item.healthy).length, networks: health }, activity: radar.pools, pools24hSample: { count: pools24h, sampleSize: radar.pools.length, label: "Recent pool sample", complete: false }, security: { available: false, reason: "No authorized audit-verdict provider is connected. Permission warnings are not audits." }, mirror: checkpoint, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Overview unavailable" }, { status: 502 }) }
}
