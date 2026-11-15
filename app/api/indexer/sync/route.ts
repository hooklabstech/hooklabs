import { NextResponse } from "next/server"
import { syncRecentHookTransactions } from "@/lib/hook-transaction-indexer"
import { persistBatch, readCheckpoint, recordIndexerError } from "@/lib/indexer-db"
import { tackle } from "@/lib/tackle"

export const maxDuration = 45

export async function GET(request: Request) {
  const authorized = process.env.NODE_ENV === "development" || Boolean(process.env.CRON_SECRET && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const [stats, checkpoint, activity] = await Promise.all([tackle.stats(), readCheckpoint(), tackle.radar(50)])
    const offset = checkpoint?.status === "complete" ? 0 : Number(checkpoint?.next_offset ?? 0)
    const page = await tackle.hooks({ limit: 100, offset, sort: "pools" })
    const nextOffset = offset + page.hooks.length
    const complete = nextOffset >= page.total
    const [, transactions] = await Promise.all([
      persistBatch({ hooks: page.hooks, pools: activity.pools, nextOffset: complete ? 0 : nextOffset, sourceHeadBlock: stats.index.headBlock, complete }),
      syncRecentHookTransactions(),
    ])
    return NextResponse.json({ ok: true, provider: "tacklehooks.xyz", fetched: page.hooks.length, nextOffset: complete ? 0 : nextOffset, total: page.total, complete, headBlock: stats.index.headBlock, transactions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed"
    await recordIndexerError(message).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
