import { isAddress, isHash } from "viem"

export const explorers = {
  1: { name: "Etherscan", baseUrl: "https://etherscan.io" },
  8453: { name: "BaseScan", baseUrl: "https://basescan.org" },
  42161: { name: "Arbiscan", baseUrl: "https://arbiscan.io" },
  130: { name: "Uniscan", baseUrl: "https://uniscan.xyz" },
  4663: { name: "Robinhood Chain Blockscout", baseUrl: "https://robinhoodchain.blockscout.com" },
} as const

export type SupportedChainId = keyof typeof explorers

export function explorerUrl(chainId: number, kind: "address" | "tx" | "block", value: string | number) {
  const explorer = explorers[chainId as SupportedChainId]
  if (!explorer) return null
  if (kind === "address" && (typeof value !== "string" || !isAddress(value))) return null
  if (kind === "tx" && (typeof value !== "string" || !isHash(value))) return null
  if (kind === "block" && (!Number.isSafeInteger(Number(value)) || Number(value) < 0)) return null
  return `${explorer.baseUrl}/${kind}/${value}`
}
