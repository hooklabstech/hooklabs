import { Activity, AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ScanResult } from "@/lib/scanner-types"

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border/70 bg-background/40 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>
}

export function ScannerResults({ result }: { result: ScanResult }) {
  const riskTone = result.risk.level === "Low" ? "text-emerald-400" : result.risk.level === "Moderate" ? "text-amber-300" : "text-red-400"
  const enabledPermissions = result.permissions.filter((permission) => permission.enabled)
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-2">
      {result.isContract ? <Badge className="bg-emerald-500/15 text-emerald-400"><CheckCircle2 />Deployed contract</Badge> : <Badge variant="destructive"><AlertTriangle />No bytecode</Badge>}
      <Badge variant="outline">{result.chainName}</Badge><Badge variant="outline">{result.bytecodeSize.toLocaleString()} bytes</Badge>
      <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline">Explorer <ExternalLink className="size-3" /></a>
    </div>

    <section aria-labelledby="risk-heading" className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
      <div className="flex items-start justify-between gap-4"><div><p className="section-kicker">Automated analysis</p><h2 id="risk-heading" className="mt-1 font-semibold">Risk breakdown</h2></div><div className="text-right"><p className={`text-3xl font-semibold ${riskTone}`}>{result.risk.score}</p><p className={`text-xs font-medium ${riskTone}`}>{result.risk.level} risk</p></div></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500" style={{ width: `${Math.max(2, result.risk.score)}%` }} /></div>
      <div className="mt-4 space-y-2">{result.risk.factors.map((factor) => <div key={factor.label} className="flex gap-3 rounded-lg border border-border/60 p-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-medium">{factor.label} <span className="text-xs text-muted-foreground">{factor.impact > 0 ? `+${factor.impact}` : factor.impact}</span></p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{factor.detail}</p></div></div>)}</div>
    </section>

    {result.pons && <section aria-labelledby="pons-heading" className="rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">Ponsfamily detection</p><h2 id="pons-heading" className="mt-1 font-semibold">{result.pons.verified ? "Canonical Pons v2 launch" : "No Pons v2 launch record"}</h2></div>{result.pons.verified && <Badge className="bg-emerald-500/15 text-emerald-400"><CheckCircle2 />Factory verified</Badge>}</div>
      {result.pons.verified && <><div className="mt-4 grid gap-2 sm:grid-cols-3"><Stat label="Launch phase" value={result.pons.phaseLabel} /><Stat label="Pool fee" value={result.pons.poolFee === null ? "Unavailable" : `${result.pons.poolFee / 10_000}%`} /><Stat label="Tick spacing" value={String(result.pons.tickSpacing ?? "Unavailable")} /></div>
        {result.pons.progressPercent !== null && <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="size-3.5" />Graduation progress</span><span className="font-medium">{result.pons.progressPercent.toFixed(2)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${result.pons.progressPercent}%` }} /></div></div>}
        <div className="mt-4 flex flex-wrap gap-2"><a className={cn(buttonVariants({ size: "sm" }))} href={result.pons.tradeUrl ?? "https://pons.family/launchpad"} target="_blank" rel="noreferrer">Trade on Pons <ExternalLink /></a>{result.pons.curve && <a className={cn(buttonVariants({ size: "sm", variant: "outline" }))} href={`https://explorer.chain.robinhood.com/address/${result.pons.curve}`} target="_blank" rel="noreferrer">Curve contract <ExternalLink /></a>}</div></>}
    </section>}

    <section aria-labelledby="permissions-heading"><div className="mb-3 flex items-center justify-between"><h2 id="permissions-heading" className="text-sm font-medium">Uniswap v4 permissions · 0x{result.hookFlags.toString(16).padStart(4, "0")}</h2><Badge variant="outline">{enabledPermissions.length} enabled</Badge></div><div className="grid gap-2 sm:grid-cols-2">{result.permissions.map((permission) => <div key={permission.name} className="flex items-center justify-between rounded-lg border p-3"><code className="text-xs">{permission.name}</code><span className={`size-2 rounded-full ${permission.enabled ? "bg-primary" : "bg-muted"}`} aria-label={permission.enabled ? "Enabled" : "Disabled"} /></div>)}</div></section>

    {(result.legacyPool || result.registryProvider) && <section aria-labelledby="pools-heading"><div className="mb-3 flex items-center justify-between"><h2 id="pools-heading" className="text-sm font-medium">Pool discovery</h2><Badge variant="outline">V3 / V4</Badge></div>{result.legacyPool && <a href={result.legacyPool.explorerUrl} target="_blank" rel="noreferrer" className="mb-2 flex items-center justify-between rounded-lg border p-3 transition hover:border-primary/30"><span><span className="block text-sm font-medium">Canonical V3 pool</span><span className="font-mono text-[10px] text-muted-foreground">{result.legacyPool.address}</span></span><ExternalLink className="size-4 text-muted-foreground" /></a>}{result.relatedPools.length ? <div className="space-y-2">{result.relatedPools.slice(0, 5).map((pool) => <a key={pool.id} href={`https://explorer.chain.robinhood.com/tx/${pool.txHash}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 transition hover:border-primary/30"><span><span className="block text-sm font-medium">{pool.pair}</span><span className="font-mono text-[10px] text-muted-foreground">V4 · #{pool.createdBlock.toLocaleString()} · fee {pool.fee}</span></span><ExternalLink className="size-4 text-muted-foreground" /></a>)}</div> : result.registryProvider && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No associated v4 pools are present in the provider index.</p>}{result.registryProvider && <p className="mt-2 text-xs text-muted-foreground">V4 pool data by {result.registryProvider}; {result.relatedPoolsTotal?.toLocaleString() ?? "unknown"} indexed associations.</p>}</section>}

    <p className="flex gap-2 text-xs leading-5 text-muted-foreground"><Activity className="mt-0.5 size-4 shrink-0" />{result.disclaimer}</p>
  </div>
}
