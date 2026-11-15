"use client"

import { Check, ChevronDown, LogOut, Wallet } from "lucide-react"
import { formatUnits } from "viem"
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function WalletButton() {
  const { address, chain, isConnected } = useAccount()
  const { connectors, connectAsync, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { chains, switchChainAsync } = useSwitchChain()
  const { data: balance } = useBalance({ address, query: { enabled: Boolean(address) } })
  async function connect() {
    const connector = connectors[0]
    if (!connector) { window.open("https://ethereum.org/wallets/", "_blank", "noopener,noreferrer"); return }
    try { await connectAsync({ connector }) } catch (error) { toast.error(error instanceof Error && error.message.toLowerCase().includes("reject") ? "Connection request rejected" : "Wallet connection failed") }
  }
  if (!isConnected || !address) return <Button variant="outline" size="sm" onClick={connect} disabled={isPending}><Wallet/>{isPending ? "Connecting…" : "Connect"}</Button>
  const unsupported = !chain || !chains.some((item) => item.id === chain.id)
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant={unsupported ? "destructive" : "outline"} size="sm"/>}><span className="size-2 rounded-full bg-current opacity-70"/>{address.slice(0,6)}…{address.slice(-4)}<ChevronDown/></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel><span className="block text-xs font-normal text-muted-foreground">{chain?.name ?? "Unsupported network"}</span><span className="mt-1 block font-mono text-xs">{balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : "Balance unavailable"}</span></DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuLabel className="text-xs text-muted-foreground">Switch network</DropdownMenuLabel>{chains.map((item) => <DropdownMenuItem key={item.id} onClick={async () => { try { await switchChainAsync({ chainId: item.id }) } catch { toast.error("Network switch was rejected") } }}>{chain?.id === item.id && <Check/>}{item.name}</DropdownMenuItem>)}<DropdownMenuSeparator/><DropdownMenuItem variant="destructive" onClick={() => disconnect()}><LogOut/>Disconnect</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
}
