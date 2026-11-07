import { createPublicClient, defineChain, http, isAddress, type Address } from "viem"
import { mainnet, base, arbitrum, unichain } from "viem/chains"

const robinhood = defineChain({ id: 4663, name: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } }, blockExplorers: { default: { name: "Robinhood Explorer", url: "https://explorer.chain.robinhood.com" } } })
export const supportedChains = [mainnet, base, arbitrum, unichain, robinhood] as const
export function getChain(chainId: number) { return supportedChains.find((chain) => chain.id === chainId) }
export function explorerAddress(chainId: number, address: string) { const chain = getChain(chainId); return chain?.blockExplorers?.default ? `${chain.blockExplorers.default.url}/address/${address}` : "" }
export function getClient(chainId: number) { const chain = getChain(chainId); if (!chain) throw new Error("Unsupported chain"); return createPublicClient({ chain, transport: http(undefined, { timeout: 8000, retryCount: 2, retryDelay: 250 }) }) }

const erc20Abi = [
  { type: "function", stateMutability: "view", name: "name", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", stateMutability: "view", name: "symbol", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", stateMutability: "view", name: "decimals", inputs: [], outputs: [{ type: "uint8" }] },
] as const
const permissionNames = ["beforeInitialize", "afterInitialize", "beforeAddLiquidity", "afterAddLiquidity", "beforeRemoveLiquidity", "afterRemoveLiquidity", "beforeSwap", "afterSwap", "beforeDonate", "afterDonate", "beforeSwapReturnDelta", "afterSwapReturnDelta", "afterAddLiquidityReturnDelta", "afterRemoveLiquidityReturnDelta"] as const

export async function inspectAddress(address: string, chainId: number) {
  if (!isAddress(address)) throw new Error("Invalid address")
  const client = getClient(chainId)
  const code = await client.getCode({ address: address as Address })
  const isContract = Boolean(code && code !== "0x")
  const flags = Number(BigInt(address) & BigInt(0x3fff))
  const permissions = permissionNames.map((name, index) => ({ name, enabled: Boolean(flags & (1 << (13 - index))) }))
  const metadata = { name: null as string | null, symbol: null as string | null, decimals: null as number | null }
  if (isContract) {
    const results = await Promise.allSettled(erc20Abi.map((item) => client.readContract({ address: address as Address, abi: erc20Abi, functionName: item.name } as never)))
    if (results[0]?.status === "fulfilled") metadata.name = String(results[0].value)
    if (results[1]?.status === "fulfilled") metadata.symbol = String(results[1].value)
    if (results[2]?.status === "fulfilled") metadata.decimals = Number(results[2].value)
  }
  return { address, chainId, chainName: getChain(chainId)?.name, isContract, bytecodeSize: code ? (code.length - 2) / 2 : 0, hookFlags: flags, permissions, token: metadata, explorerUrl: explorerAddress(chainId, address), blockNumber: Number(await client.getBlockNumber()), checkedAt: new Date().toISOString(), disclaimer: "Address flags determine callbacks the PoolManager may invoke; they are not an audit or proof of behavior." }
}
