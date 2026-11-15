export type PermissionResult = { name: string; enabled: boolean }

export type RelatedPool = {
  id: string
  pair: string
  createdAt?: string | null
  createdBlock: number
  txHash: string
  fee: number
  tickSpacing: number
}

export type RiskFactor = {
  label: string
  impact: number
  detail: string
}

export type PonsLaunch = {
  verified: boolean
  factory: string
  curve: string | null
  deployer: string | null
  pairToken: string | null
  phase: number | null
  phaseLabel: string
  graduationThreshold: string | null
  raisedQuote: string | null
  progressPercent: number | null
  quoteReserve: string | null
  tokenReserve: string | null
  poolFee: number | null
  tickSpacing: number | null
  tradeUrl: string | null
}

export type LegacyPool = {
  version: "v3"
  address: string
  explorerUrl: string
}

export type ScanResult = {
  address: string
  chainId: number
  chainName: string
  isContract: boolean
  bytecodeSize: number
  hookFlags: number
  permissions: PermissionResult[]
  token: { name: string | null; symbol: string | null; decimals: number | null }
  explorerUrl: string
  blockNumber: number
  checkedAt: string
  disclaimer: string
  pons: PonsLaunch | null
  legacyPool: LegacyPool | null
  risk: { score: number; level: "Low" | "Moderate" | "High" | "Critical"; factors: RiskFactor[] }
  relatedPools: RelatedPool[]
  relatedPoolsTotal: number | null
  registryProvider: string | null
}
