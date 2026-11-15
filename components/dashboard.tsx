"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Activity, ArrowRight, Copy, Database, ExternalLink,
  Layers3, Radar, RefreshCw, Search, Terminal,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Hook = {
  address: string; name?: string | null; label?: string | null; flagsHex: string;
  enabled: string[]; pools: number; firstSeenBlock: number;
  lastPoolBlock: number; lastPoolAt?: string | null; warnings: string[];
  chainId: number; chain: string; explorerUrl: string; freshness?: string | null;
}
type HooksResponse = {
  data: Hook[]; pagination: { page: number; limit: number; total: number; pages: number };
  provider: string; source: string;
}
type ActivityEvent = {
  poolId: string; pair: string; createdBlock: number; createdAt: string;
  txHash: string; hook: { address: string; label?: string | null; name?: string | null };
}
type MetricState = { status: "complete" | "partial" | "indexing" | "unavailable"; total: number | null; detail: string }
type Overview = {
  provider: { name: string; url: string; chainId: number; chainName: string };
  index: { pools: number; hookedPools: number; uniqueHooks: number; namedHooks: number; indexedThroughBlock: number; headBlock: number; tokens: number };
  rpc: { configured: number; healthy: number; networks: { chainId: number; name: string; healthy: boolean; block: number | null; latencyMs: number }[] };
  activity: ActivityEvent[];
  metrics: { securityAssessments: MetricState; hookTransactions24h: MetricState };
  mirror: { status: string; indexed_records: number; updated_at: string } | null;
  updatedAt: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Request failed")
  return response.json()
}
const compact = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)

function Loading() {
  return <main className="mx-auto max-w-[1536px] space-y-5 px-4 py-8 sm:px-6">
    <Skeleton className="h-52 rounded-2xl" />
    <Skeleton className="h-20 rounded-xl" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,.72fr)]">
      <Skeleton className="h-[440px] rounded-2xl" /><Skeleton className="h-[440px] rounded-2xl" />
    </div>
  </main>
}

function CopyButton({ value }: { value: string }) {
  return <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary"
    onClick={() => {
      void navigator.clipboard.writeText(value).then(() => toast.success("Contract address copied")).catch(() => toast.error("Could not copy address"))
    }}>
    <Copy className="size-4" /><span className="sr-only">Copy contract address</span>
  </Button>
}

export function Dashboard({ view = "dashboard" }: { view?: "dashboard" | "hooks" | "docs" }) {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [permission, setPermission] = useState("All permissions")
  const { data: overview, error: overviewError, isLoading: overviewLoading, mutate: refreshOverview } = useSWR<Overview>(
    view === "docs" ? null : "/api/overview", fetcher, { refreshInterval: 30000 },
  )
  const { data: registry, error: registryError, isLoading: registryLoading, mutate: refreshRegistry } = useSWR<HooksResponse>(
    view === "docs" ? null : `/api/hooks?page=${view === "hooks" ? page : 1}&limit=${view === "hooks" ? 20 : 5}&sort=pools`,
    fetcher, { refreshInterval: 30000 },
  )
  const filtered = useMemo(() => (registry?.data ?? []).filter(hook =>
    `${hook.label ?? ""} ${hook.name ?? ""} ${hook.address}`.toLowerCase().includes(query.toLowerCase()) &&
    (permission === "All permissions" || hook.enabled.includes(permission)),
  ), [registry, query, permission])

  if (view === "docs") return <Docs />
  if (overviewLoading || registryLoading) return <Loading />
  if (overviewError || registryError || !overview || !registry) return <main className="mx-auto max-w-2xl px-4 py-24 text-center">
    <h1 className="text-2xl font-semibold">Live data unavailable</h1>
    <p className="mt-2 text-muted-foreground">HOOKLABS could not reach the indexing provider. Your saved data has not been changed.</p>
    <Button className="mt-5" onClick={() => { void refreshOverview(); void refreshRegistry() }}><RefreshCw /> Retry</Button>
  </main>

  const permissions = ["All permissions", ...Array.from(new Set(registry.data.flatMap(hook => hook.enabled))).sort()]
  if (view === "hooks") return <main className="mx-auto max-w-[1536px] px-3 pb-12 pt-8 sm:px-5 lg:px-6">
    <section>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="section-kicker">Live PoolManager index</p><h1 className="mt-2 text-4xl font-semibold">Labs directory</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{registry.pagination.total.toLocaleString()} hook contracts indexed on {overview.provider.chainName}.</p>
        </div>
        <Button variant="outline" onClick={() => { void refreshOverview(); void refreshRegistry() }}><RefreshCw />Refresh</Button>
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter this page by name or address" className="pl-9" />
        </div>
        <FilterSelect value={permission} onChange={setPermission} items={permissions} />
      </div>
      <Card><CardHeader><CardTitle>{registry.pagination.total.toLocaleString()} indexed hooks</CardTitle>
        <CardDescription>Source head {overview.index.indexedThroughBlock.toLocaleString()} / {overview.index.headBlock.toLocaleString()} · updated {new Date(overview.updatedAt).toISOString().replace("T", " ").slice(0, 19)} UTC</CardDescription>
      </CardHeader><CardContent><HookTable hooks={filtered} detail />
        <div className="mt-5 flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {registry.pagination.pages.toLocaleString()}</span>
          <Button variant="outline" disabled={page >= registry.pagination.pages} onClick={() => setPage(value => value + 1)}>Next</Button>
        </div>
      </CardContent></Card>
    </section>
  </main>

  const tx = overview.metrics.hookTransactions24h
  const assessments = overview.metrics.securityAssessments
  return <main className="hook-workstation mx-auto max-w-[1536px] px-3 pb-10 pt-5 sm:px-5 lg:px-6">
    <section className="workstation-stage relative overflow-hidden rounded-[1.4rem] px-1 pb-3 pt-3 sm:px-3 xl:px-3 xl:py-5">
      <div className="relative z-10">
      <div className="min-w-0 px-3 py-4 lg:px-2">
        <p className="section-kicker tracking-[.3em]">Hook intelligence workstation</p>
        <h1 className="mt-4 max-w-[660px] text-[2.45rem] font-semibold leading-[1.03] tracking-[-.052em] sm:text-[3rem] xl:text-[3.15rem]">
          Smarter insights.<br className="hidden sm:block" /> <span className="text-primary">Better visibility.</span>
        </h1>
        <p className="mt-3 max-w-[535px] text-[.94rem] leading-6 text-[#aeb9c6]">
          Track contracts, discover activity, and understand the on-chain ecosystem.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/scanner" className={`${buttonVariants({ size: "sm" })} workstation-primary h-9 rounded-lg px-4`}><Radar className="size-3.5" /> Inspect a contract</Link>
          <Link href="/hooks" className={`${buttonVariants({ variant: "outline", size: "sm" })} border-white/20 bg-black/35 px-4`}>Browse registry <ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
      </div>
    </section>

    <section className="workstation-kpi-strip" aria-label="Live platform metrics">
      <Kpi label="Hooks discovered" value={overview.index.uniqueHooks.toLocaleString()} accent />
      <Kpi label="RPC healthy" value={`${overview.rpc.healthy}/${overview.rpc.configured}`} />
      <Kpi label="24h hook transactions" value={tx.total === null ? (tx.status === "indexing" ? "Indexing" : "—") : `${tx.total.toLocaleString()}${tx.status === "partial" ? "+" : ""}`} note={tx.status !== "complete" ? tx.detail : undefined} />
      <Kpi label="Security assessments" value={assessments.total === null ? "—" : assessments.total.toLocaleString()} note={assessments.status !== "complete" ? assessments.detail : undefined} />
    </section>

    <section className="mt-4 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(290px,.72fr)]" aria-label="Live registry and recent on-chain activity">
      <div className="workstation-card registry-panel min-w-0 overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Layers3 className="size-5 shrink-0 text-primary" />
            <h2 className="text-[1.35rem] font-semibold tracking-tight sm:text-[1.5rem]">Live Hook Registry</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"><span className="size-1.5 rounded-full bg-primary" />Live</span>
            <span className="text-xs text-[#b0bdca]">{compact(overview.index.hookedPools)} indexed pools</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[155px] sm:w-[180px]"><FilterSelect value={permission} onChange={setPermission} items={permissions} /></div>
            <Link href="/hooks" className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium transition hover:text-primary">View all <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
        <div className="workstation-registry-table px-3 pb-4 pt-1 sm:px-5"><HookTable hooks={filtered} /></div>
        <div className="border-t border-white/10 px-5 py-3 text-[11px] text-muted-foreground">
          Robinhood Chain · updated {new Date(overview.updatedAt).toISOString().slice(11, 16)} UTC
        </div>
      </div>
      <div className="workstation-card activity-panel min-w-0 overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-1 pt-5">
          <div className="flex items-center gap-3"><Activity className="size-5 text-[#8ccaff]" /><h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2></div>
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary"><span className="size-1.5 rounded-full bg-primary" />Live feed</span>
        </div>
        <p className="px-5 pb-3 text-xs text-muted-foreground">Latest indexed pool initializations.</p>
        <ActivityTimeline events={overview.activity} updatedAt={overview.updatedAt} />
        <div className="px-5 pb-5 pt-2"><Link href="/hooks" className={`${buttonVariants({ variant: "outline", size: "sm" })} h-9 w-full border-white/25 bg-black/20`}>View full registry <ArrowRight className="size-3.5" /></Link></div>
      </div>
    </section>

  </main>
}

function Kpi({ label, value, note, accent = false }: { label: string; value: string; note?: string; accent?: boolean }) {
  return <div className={`workstation-kpi ${accent ? "workstation-kpi-accent" : ""}`} title={note}>
    <span className="text-[1.45rem] font-semibold leading-none tracking-tight sm:text-[1.6rem]">{value}</span>
    <span className="mt-1.5 text-[11px] text-[#a5b1bd]">{label}</span>
    {note && <span className="sr-only">{note}</span>}
  </div>
}

function ActivityTimeline({ events, updatedAt }: { events: ActivityEvent[]; updatedAt: string }) {
  const relative = (createdAt: string) => {
    const seconds = Math.max(0, Math.floor((Date.parse(updatedAt) - Date.parse(createdAt)) / 1000))
    if (!Number.isFinite(seconds)) return "—"
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  if (!events.length) return <p className="px-5 py-14 text-center text-xs text-muted-foreground">No recent indexed pool events.</p>
  return <ol className="activity-timeline mx-5 mb-4 flex flex-col gap-0">
    {events.slice(0, 5).map(event => <li key={`${event.poolId}-${event.txHash}`} className="activity-timeline-item relative py-2.5 pl-5">
      <span className="activity-timeline-dot" />
      <a href={`https://robinhoodchain.blockscout.com/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="group block rounded-md hover:text-primary">
        <div className="flex min-w-0 items-start justify-between gap-2"><p className="min-w-0 truncate text-sm font-semibold">{event.pair}</p><span className="shrink-0 whitespace-nowrap text-[10px] text-primary">{relative(event.createdAt)}</span></div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Pool initialized · {event.hook.label || event.hook.name || `${event.hook.address.slice(0, 9)}…`}</p>
        <p className="mt-1 truncate font-mono text-[10px] text-[#8093a2]">#{event.createdBlock.toLocaleString()} · {new Date(event.createdAt).toISOString().slice(11, 19)} UTC</p>
      </a>
    </li>)}
  </ol>
}

function FilterSelect({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: string[] }) {
  return <Select value={value} onValueChange={next => onChange(next as string)}>
    <SelectTrigger className="h-8 w-full border-white/20 bg-black/35 text-xs"><SelectValue>{value}</SelectValue></SelectTrigger>
    <SelectContent><SelectGroup>{items.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
  </Select>
}

function HookTable({ hooks, detail = false }: { hooks: Hook[]; detail?: boolean }) {
  if (!hooks.length) return <div className="py-16 text-center text-sm text-muted-foreground">No hooks match this filter.</div>
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow>
    <TableHead>Hook</TableHead><TableHead>Permissions</TableHead><TableHead>Pools</TableHead>
    {detail && <TableHead>Discovered</TableHead>}<TableHead>Freshness</TableHead><TableHead className="w-12" />
  </TableRow></TableHeader><TableBody>{hooks.map(hook => <TableRow key={hook.address}>
    <TableCell><a href={hook.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary">{hook.label || hook.name || "Unnamed hook"} <ExternalLink className="inline size-3" /></a>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{hook.address.slice(0, 10)}…{hook.address.slice(-6)}</p></TableCell>
    <TableCell><div className="flex max-w-56 flex-wrap gap-1">{hook.enabled.slice(0, 2).map(flag => <Badge key={flag} variant="outline" className="rounded-full border-white/20 bg-white/[.035] px-2 py-0.5 text-[10px] font-normal">{flag}</Badge>)}
      {hook.enabled.length > 2 && <Badge variant="secondary" className="rounded-full text-[10px]">+{hook.enabled.length - 2}</Badge>}</div></TableCell>
    <TableCell className="tabular-nums">{hook.pools.toLocaleString()}</TableCell>
    {detail && <TableCell className="font-mono text-xs">#{hook.firstSeenBlock.toLocaleString()}</TableCell>}
    <TableCell className="text-xs text-muted-foreground">{hook.lastPoolAt ? new Date(hook.lastPoolAt).toISOString().slice(0, 10) : "No recent pool"}</TableCell>
    <TableCell><CopyButton value={hook.address} /></TableCell>
  </TableRow>)}</TableBody></Table></div>
}

function Docs() {
  const endpoints = [
    { value: "overview", method: "GET", path: "/api/overview", body: '{"index":{"uniqueHooks":31464},"rpc":{"healthy":…}}' },
    { value: "hooks", method: "GET", path: "/api/hooks?page=1&limit=20", body: '{"data":[…],"provider":"…"}' },
    { value: "pools", method: "GET", path: "/api/pools?hook=0x…", body: '{"pools":[…],"chainId":4663}' },
    { value: "scanner", method: "GET", path: "/api/scanner/0x…?chainId=4663", body: '{"isContract":true,"permissions":[…],"relatedPools":[…]}' },
    { value: "health", method: "GET", path: "/api/indexer/health", body: '{"ok":true,"source":{…},"mirror":{…}}' },
  ]
  return <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
    <div className="mb-10"><p className="section-kicker">Live developer API</p><h1 className="mt-2 text-4xl font-semibold">Verified endpoints</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">PoolManager index data on Robinhood Chain and direct RPC bytecode inspection.</p></div>
    <Tabs defaultValue="overview"><TabsList>{endpoints.map(endpoint => <TabsTrigger key={endpoint.value} value={endpoint.value}>{endpoint.value}</TabsTrigger>)}</TabsList>
      {endpoints.map(endpoint => <TabsContent key={endpoint.value} value={endpoint.value}><CodeBlock {...endpoint} /></TabsContent>)}
    </Tabs>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{[
      { Icon: Database, title: "Indexer", description: "Historical PoolManager-derived hook records." },
      { Icon: Radar, title: "Scanner", description: "Live bytecode and address permission bits." },
      { Icon: Terminal, title: "Provenance", description: "Provider and chain context in every response." },
    ].map(({ Icon, title, description }) => <Card key={title}><CardHeader>
      <Icon className="text-primary" />
      <CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription>
    </CardHeader></Card>)}</div>
  </main>
}

function CodeBlock({ method, path, body }: { method: string; path: string; body: string }) {
  return <Card className="mt-6 overflow-hidden"><CardHeader><div className="flex items-center gap-3"><Badge>{method}</Badge><code className="font-mono text-sm">{path}</code></div></CardHeader>
    <CardContent><pre className="overflow-x-auto rounded-lg border bg-black p-5 font-mono text-sm leading-6 text-primary"><code>{body}</code></pre></CardContent>
  </Card>
}
