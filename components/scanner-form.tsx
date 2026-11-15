"use client"

import { useState } from "react"
import { Loader2, Radar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScannerResults } from "@/components/scanner-results"
import type { ScanResult } from "@/lib/scanner-types"

const chains = [{ id: 1, name: "Ethereum" }, { id: 8453, name: "Base" }, { id: 42161, name: "Arbitrum" }, { id: 130, name: "Unichain" }, { id: 4663, name: "Robinhood Chain" }]

export function ScannerForm({ initialAddress = "", initialChainId = "1" }: { initialAddress?: string; initialChainId?: string }) {
  const [address, setAddress] = useState(initialAddress)
  const [chainId, setChainId] = useState(chains.some((chain) => String(chain.id) === initialChainId) ? initialChainId : "1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const valid = /^0x[a-fA-F0-9]{40}$/.test(address)

  async function scan() {
    if (!valid) return
    setLoading(true); setError(""); setResult(null)
    try {
      const response = await fetch(`/api/scanner/${address}?chainId=${chainId}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Scan failed")
      setResult(body)
    } catch (scanError) { setError(scanError instanceof Error ? scanError.message : "Scan failed") } finally { setLoading(false) }
  }

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div className="mb-8 max-w-3xl"><p className="section-kicker">Advanced onchain inspection</p><h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Token, hook &amp; pool scanner</h1><p className="mt-3 text-muted-foreground">Verify deployed bytecode, ERC-20 metadata, Uniswap v4 permissions, Ponsfamily origin and launch progress, risk signals, and indexed V3/V4 pools.</p></div>
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <Card className="h-fit xl:sticky xl:top-24"><CardHeader><CardTitle>Inspect an address</CardTitle><CardDescription>Every result is read from RPC or the named index. No key, signature, or wallet connection is required.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel htmlFor="address">Contract or token address</FieldLabel><Input id="address" value={address} onChange={(event) => setAddress(event.target.value.trim())} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) scan() }} placeholder="0x…" aria-invalid={address.length > 0 && !valid} /></Field><Field><FieldLabel>Network</FieldLabel><Select value={chainId} onValueChange={(value) => setChainId(value as string)}><SelectTrigger className="w-full"><SelectValue>{chains.find((chain) => String(chain.id) === chainId)?.name}</SelectValue></SelectTrigger><SelectContent><SelectGroup>{chains.map((chain) => <SelectItem key={chain.id} value={String(chain.id)}>{chain.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Button onClick={scan} disabled={loading || !valid}>{loading ? <Loader2 className="animate-spin" /> : <Radar />}Inspect live contract</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</FieldGroup></CardContent></Card>
      <Card><CardHeader><CardTitle>Inspection result</CardTitle><CardDescription>{result ? `Live read at block ${result.blockNumber.toLocaleString()}` : "Results appear after a successful live RPC request."}</CardDescription></CardHeader><CardContent>{result ? <ScannerResults result={result} /> : <div className="flex min-h-96 flex-col items-center justify-center text-center text-muted-foreground"><Radar className="mb-4 size-10" /><p className="max-w-sm text-sm">Enter a valid EVM address. Robinhood Chain scans automatically query the canonical Pons v2 factory and Tackle Hooks index.</p></div>}</CardContent></Card>
    </div>
  </main>
}
