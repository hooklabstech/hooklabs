import { parseAbiItem, type Address, type Hex } from "viem"
import { getClient } from "@/lib/blockchain"
import { db } from "@/lib/db"
import { hookTransactions, indexCoverage } from "@/lib/db/schema"
import { tackle } from "@/lib/tackle"

const ROBINHOOD_CHAIN_ID = 4663
const RECENT_BLOCK_WINDOW = BigInt(500)
const swapEvent = parseAbiItem("event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)")

export async function syncRecentHookTransactions() {
  const client = getClient(ROBINHOOD_CHAIN_ID)
  const [stats, pools, head] = await Promise.all([tackle.stats(), tackle.pools({ limit: 100 }), client.getBlockNumber()])
  const poolManager = Object.entries(stats.chain.contracts).find(([name]) => name.toLowerCase().includes("poolmanager"))?.[1] as Address | undefined
  if (!poolManager) throw new Error("PoolManager address unavailable from provider")
  const poolHooks = new Map<string, Address>()
  for (const pool of pools.pools) if (pool.hook.address) poolHooks.set(pool.poolId.toLowerCase(), pool.hook.address as Address)
  const fromBlock = head > RECENT_BLOCK_WINDOW ? head - RECENT_BLOCK_WINDOW : BigInt(0)
  const logs = await client.getLogs({ address: poolManager, event: swapEvent, fromBlock, toBlock: head })
  const matched = logs.filter((log) => log.args.id && poolHooks.has(log.args.id.toLowerCase()) && log.transactionHash)
  const blocks = new Map<bigint, Date>()
  for (const blockNumber of new Set(matched.map((log) => log.blockNumber))) {
    const block = await client.getBlock({ blockNumber })
    blocks.set(blockNumber, new Date(Number(block.timestamp) * 1000))
  }
  if (matched.length) await db.insert(hookTransactions).values(matched.map((log) => ({ chainId: ROBINHOOD_CHAIN_ID, transactionHash: log.transactionHash as Hex, blockNumber: Number(log.blockNumber), blockTimestamp: blocks.get(log.blockNumber) ?? new Date(), hookAddress: poolHooks.get(log.args.id!.toLowerCase())!, poolId: log.args.id! }))).onConflictDoNothing()
  await db.insert(indexCoverage).values({ chainId: ROBINHOOD_CHAIN_ID, indexedFromBlock: Number(fromBlock), indexedToBlock: Number(head), chainHeadBlock: Number(head), status: "partial", updatedAt: new Date() }).onConflictDoUpdate({ target: indexCoverage.chainId, set: { indexedFromBlock: Number(fromBlock), indexedToBlock: Number(head), chainHeadBlock: Number(head), status: "partial", updatedAt: new Date() } })
  return { chainId: ROBINHOOD_CHAIN_ID, status: "partial" as const, fromBlock: Number(fromBlock), toBlock: Number(head), matched: matched.length, indexedPools: poolHooks.size }
}
