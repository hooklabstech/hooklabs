import { createPublicClient, defineChain, http, isAddress, zeroAddress, type Address } from "viem"
import { mainnet, base, arbitrum, unichain } from "viem/chains"
import type { LegacyPool, PermissionResult, PonsLaunch, RiskFactor } from "@/lib/scanner-types"
import { explorerUrl } from "@/lib/explorers"

const robinhood = defineChain({ id: 4663, name: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } }, blockExplorers: { default: { name: "Robinhood Chain Blockscout", url: "https://robinhoodchain.blockscout.com" } } })
export const supportedChains = [mainnet, base, arbitrum, unichain, robinhood] as const
export const PONS_V2_FACTORY = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e" as Address

export function getChain(chainId: number) { return supportedChains.find((chain) => chain.id === chainId) }
export function explorerAddress(chainId: number, address: string) { return explorerUrl(chainId, "address", address) ?? "" }
export function getClient(chainId: number) { const chain = getChain(chainId); if (!chain) throw new Error("Unsupported chain"); return createPublicClient({ chain, transport: http(undefined, { timeout: 8000, retryCount: 2, retryDelay: 250 }) }) }

const erc20Abi = [
  { type: "function", stateMutability: "view", name: "name", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", stateMutability: "view", name: "symbol", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", stateMutability: "view", name: "decimals", inputs: [], outputs: [{ type: "uint8" }] },
] as const
const legacyPoolAbi = [{ type: "function", stateMutability: "view", name: "liquidityPool", inputs: [], outputs: [{ name: "", type: "address" }] }] as const
const ponsFactoryAbi = [{
  type: "function", stateMutability: "view", name: "getLaunchedToken", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "launch", type: "tuple", components: [
    { name: "token", type: "address" }, { name: "curve", type: "address" }, { name: "deployer", type: "address" }, { name: "creatorFeeRecipient", type: "address" }, { name: "pairToken", type: "address" }, { name: "graduationThreshold", type: "uint256" }, { name: "poolFee", type: "uint24" }, { name: "tickSpacing", type: "int24" }, { name: "creatorTaxBps", type: "uint16" }, { name: "buybackEnabled", type: "bool" }, { name: "phase", type: "uint8" }, { name: "sweptQuote", type: "uint256" }, { name: "sweptTokens", type: "uint256" }, { name: "sweptAt", type: "uint256" }, { name: "exists", type: "bool" },
  ] }],
}] as const
const curveAbi = [
  { type: "function", stateMutability: "view", name: "getReserves", inputs: [], outputs: [{ name: "quoteReserve", type: "uint256" }, { name: "tokenReserve", type: "uint256" }] },
  { type: "function", stateMutability: "view", name: "realQuoteReserve", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const
const permissionNames = ["beforeInitialize", "afterInitialize", "beforeAddLiquidity", "afterAddLiquidity", "beforeRemoveLiquidity", "afterRemoveLiquidity", "beforeSwap", "afterSwap", "beforeDonate", "afterDonate", "beforeSwapReturnDelta", "afterSwapReturnDelta", "afterAddLiquidityReturnDelta", "afterRemoveLiquidityReturnDelta"] as const

async function inspectPonsLaunch(address: Address, chainId: number): Promise<PonsLaunch | null> {
  if (chainId !== 4663) return null
  const client = getClient(chainId)
  try {
    const launch = await client.readContract({ address: PONS_V2_FACTORY, abi: ponsFactoryAbi, functionName: "getLaunchedToken", args: [address] })
    if (!launch.exists) return { verified: false, factory: PONS_V2_FACTORY, curve: null, deployer: null, pairToken: null, phase: null, phaseLabel: "Not a Pons v2 launch", graduationThreshold: null, raisedQuote: null, progressPercent: null, quoteReserve: null, tokenReserve: null, poolFee: null, tickSpacing: null, tradeUrl: null }
    const phaseLabels = ["Bonding curve", "Swept", "Uniswap v4 pool", "Rescued"]
    let raisedQuote: bigint | null = null
    let quoteReserve: bigint | null = null
    let tokenReserve: bigint | null = null
    if (Number(launch.phase) === 0 && launch.curve !== zeroAddress) {
      const [reserves, raised] = await Promise.allSettled([
        client.readContract({ address: launch.curve, abi: curveAbi, functionName: "getReserves" }),
        client.readContract({ address: launch.curve, abi: curveAbi, functionName: "realQuoteReserve" }),
      ])
      if (reserves.status === "fulfilled") [quoteReserve, tokenReserve] = reserves.value
      if (raised.status === "fulfilled") raisedQuote = raised.value
    }
    const threshold = launch.graduationThreshold
    const progressPercent = raisedQuote !== null && threshold > BigInt(0) ? Math.min(100, Number((raisedQuote * BigInt(10_000)) / threshold) / 100) : Number(launch.phase) >= 1 ? 100 : null
    return { verified: true, factory: PONS_V2_FACTORY, curve: launch.curve, deployer: launch.deployer, pairToken: launch.pairToken, phase: Number(launch.phase), phaseLabel: phaseLabels[Number(launch.phase)] ?? `Unknown phase ${launch.phase}`, graduationThreshold: threshold.toString(), raisedQuote: raisedQuote?.toString() ?? null, progressPercent, quoteReserve: quoteReserve?.toString() ?? null, tokenReserve: tokenReserve?.toString() ?? null, poolFee: Number(launch.poolFee), tickSpacing: Number(launch.tickSpacing), tradeUrl: null }
  } catch { return null }
}

async function inspectLegacyPool(address: Address, chainId: number): Promise<LegacyPool | null> {
  const client = getClient(chainId)
  try {
    const pool = await client.readContract({ address, abi: legacyPoolAbi, functionName: "liquidityPool" })
    if (pool === zeroAddress) return null
    const code = await client.getCode({ address: pool })
    return code && code !== "0x" ? { version: "v3", address: pool, explorerUrl: explorerAddress(chainId, pool) } : null
  } catch { return null }
}

export function assessRisk(input: { isContract: boolean; bytecodeSize: number; token: { name: string | null; symbol: string | null }; permissions: PermissionResult[]; pons: PonsLaunch | null; poolCount: number }): { score: number; level: "Low" | "Moderate" | "High" | "Critical"; factors: RiskFactor[] } {
  const factors: RiskFactor[] = []
  if (!input.isContract) factors.push({ label: "No deployed bytecode", impact: 100, detail: "The address is not a contract on the selected network." })
  if (input.isContract && input.bytecodeSize < 100) factors.push({ label: "Minimal bytecode", impact: 20, detail: "Very small runtime bytecode can indicate a proxy or unusual contract." })
  if (input.isContract && (!input.token.name || !input.token.symbol)) factors.push({ label: "Incomplete token metadata", impact: 12, detail: "Standard ERC-20 name or symbol calls did not both resolve." })
  const enabled = input.permissions.filter((permission) => permission.enabled)
  if (input.poolCount > 0 && enabled.length >= 8) factors.push({ label: "Broad hook permissions", impact: 16, detail: `${enabled.length} Uniswap v4 callbacks are encoded in this indexed hook address.` })
  if (input.poolCount > 0 && enabled.some((permission) => permission.name.includes("ReturnDelta"))) factors.push({ label: "Return-delta permissions", impact: 18, detail: "The indexed hook may alter swap or liquidity deltas; review its implementation carefully." })
  if (input.pons?.verified) factors.push({ label: "Verified Pons v2 origin", impact: -22, detail: "The canonical Pons v2 factory returned an active launch record." })
  if (input.pons && !input.pons.verified) factors.push({ label: "Unverified Pons origin", impact: 10, detail: "The canonical factory has no launch record for this token." })
  if (!factors.length) factors.push({ label: "No elevated signals", impact: 0, detail: "The automated checks did not identify an elevated signal." })
  const score = Math.max(0, Math.min(100, 20 + factors.reduce((total, factor) => total + factor.impact, 0)))
  const level = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low"
  return { score, level, factors }
}

export async function inspectAddress(address: string, chainId: number) {
  if (!isAddress(address)) throw new Error("Invalid address")
  const client = getClient(chainId)
  const normalizedAddress = address as Address
  const code = await client.getCode({ address: normalizedAddress })
  const isContract = Boolean(code && code !== "0x")
  const flags = Number(BigInt(normalizedAddress) & BigInt(0x3fff))
  const permissions = permissionNames.map((name, index) => ({ name, enabled: Boolean(flags & (1 << (13 - index))) }))
  const metadata = { name: null as string | null, symbol: null as string | null, decimals: null as number | null }
  if (isContract) {
    const results = await Promise.allSettled(erc20Abi.map((item) => client.readContract({ address: normalizedAddress, abi: erc20Abi, functionName: item.name } as never)))
    if (results[0]?.status === "fulfilled") metadata.name = String(results[0].value)
    if (results[1]?.status === "fulfilled") metadata.symbol = String(results[1].value)
    if (results[2]?.status === "fulfilled") metadata.decimals = Number(results[2].value)
  }
  const [pons, legacyPool, blockNumber] = await Promise.all([isContract ? inspectPonsLaunch(normalizedAddress, chainId) : null, isContract ? inspectLegacyPool(normalizedAddress, chainId) : null, client.getBlockNumber()])
  return { address: normalizedAddress, chainId, chainName: getChain(chainId)?.name ?? "Unknown", isContract, bytecodeSize: code ? (code.length - 2) / 2 : 0, hookFlags: flags, permissions, token: metadata, pons, legacyPool, explorerUrl: explorerAddress(chainId, normalizedAddress), blockNumber: Number(blockNumber), checkedAt: new Date().toISOString(), disclaimer: "Automated onchain signals are informational, not an audit. Address flags indicate callbacks the PoolManager may invoke; they do not prove implementation behavior or safety." }
}
