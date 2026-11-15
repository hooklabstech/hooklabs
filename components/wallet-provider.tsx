"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, http } from "wagmi"
import { arbitrum, base, mainnet, unichain } from "wagmi/chains"
import { injected } from "wagmi/connectors"

const config = createConfig({ chains: [mainnet, base, arbitrum, unichain], connectors: [injected()], ssr: true, transports: { [mainnet.id]: http(), [base.id]: http(), [arbitrum.id]: http(), [unichain.id]: http() } })

export function WalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>
}
