import { z } from "zod"

const API = "https://tacklehooks.xyz/v1"
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/)
const hookSchema = z.object({ address, name: z.string().nullable().optional(), label: z.string().nullable().optional(), flagsHex: z.string(), enabled: z.array(z.string()), pools: z.number().int().nonnegative(), firstSeenBlock: z.number().int().nonnegative(), lastPoolBlock: z.number().int().nonnegative(), lastPoolAt: z.string().nullable().optional(), warnings: z.array(z.string()).default([]), upgradeable: z.boolean().nullable().optional() })
const poolSchema = z.object({ poolId: z.string(), pair: z.string(), createdBlock: z.number().int(), createdAt: z.string(), txHash: z.string(), key: z.object({ hooks: address, fee: z.number().int().nonnegative().optional(), tickSpacing: z.number().int().optional() }).optional(), hook: z.object({ address, name: z.string().nullable().optional(), label: z.string().nullable().optional(), flagsHex: z.string(), warnings: z.array(z.string()).default([]), enabled: z.array(z.string()).optional(), tone: z.string().optional(), notes: z.array(z.string()).optional() }), currency0: z.object({ address, symbol: z.string().nullable().optional(), name: z.string().nullable().optional(), decimals: z.number().optional() }), currency1: z.object({ address, symbol: z.string().nullable().optional(), name: z.string().nullable().optional(), decimals: z.number().optional() }) })
const statsSchema = z.object({ chain: z.object({ id: z.number(), name: z.string(), explorer: z.string().url(), contracts: z.record(z.string(), address) }), index: z.object({ pools: z.number(), hookedPools: z.number(), uniqueHooks: z.number(), namedHooks: z.number(), indexedThroughBlock: z.number(), headBlock: z.number(), tokens: z.number() }) })
const hooksSchema = z.object({ total: z.number(), limit: z.number(), offset: z.number(), hooks: z.array(hookSchema) })
const poolsSchema = z.object({ total: z.number().optional(), limit: z.number().optional(), offset: z.number().optional(), pools: z.array(poolSchema) })

async function request<T>(path: string, schema: z.ZodType<T>, revalidate = 30): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { accept: "application/json", "user-agent": "HOOKLABS/1.0 (+https://hooklabs.v0.build)" }, next: { revalidate }, signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error(`Tackle Hooks API returned ${response.status}`)
  return schema.parse(await response.json())
}
export const tackle = {
  stats: () => request("/stats", statsSchema, 30),
  hooks: (input: { limit: number; offset: number; sort?: "pools" | "recent" }) => request(`/hooks?limit=${input.limit}&offset=${input.offset}&sort=${input.sort ?? "pools"}`, hooksSchema, 30),
  pools: (input: { limit: number; offset?: number; hook?: string; since?: string }) => { const query = new URLSearchParams({ limit: String(input.limit), offset: String(input.offset ?? 0), hooked: "true" }); if (input.hook) query.set("hook", input.hook); if (input.since) query.set("since", input.since); return request(`/pools?${query}`, poolsSchema, 20) },
  radar: (limit = 20) => request(`/radar?limit=${limit}`, poolsSchema.pick({ pools: true }), 15),
}
export type TackleHook = z.infer<typeof hookSchema>
export type TacklePool = z.infer<typeof poolSchema>
