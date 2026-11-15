"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { ArrowRight, CalendarDays, Check, ChevronDown, CircleDot, Clock3, Copy, ExternalLink, FlaskConical, Info, LockKeyhole, Map, Megaphone, Network, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SiteConfig } from "@/lib/config"
import { usePublicConfig } from "@/lib/public-config-client"
import { HooklbMiniChart } from "@/components/hooklb-mini-chart"

type TokenVerification = {
  deployed: boolean
  chainId: number
  checkedAt: string
  blockNumber: number
  token: { name: string | null; symbol: string | null; decimals: number | null; totalSupply: string | null } | null
  pons: { verified: boolean; phase: number | null; phaseLabel: string; poolFee: number | null; tradingFees: { baseFeeBps: number; creatorTaxBps: number; totalFeeBps: number } | null; progressPercent: number | null } | null
}
async function fetchTokenVerification(url: string): Promise<TokenVerification> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Token verification unavailable")
  return response.json()
}
const useConfig = usePublicConfig
function PageLoading() { return <main className="mx-auto min-h-[70vh] max-w-[1400px] px-4 py-10"><div className="h-80 animate-pulse rounded-3xl bg-muted" /></main> }
function CopyAddress({ address }: { address: string }) { return <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(address); toast.success("Contract address copied") }}><Copy />Copy</Button> }
function ConfigError() { return <main className="mx-auto max-w-2xl px-4 py-24 text-center"><h1 className="text-2xl">Ecosystem configuration unavailable</h1><p className="mt-2 text-muted-foreground">The public configuration file could not be loaded.</p></main> }

export function TokenEcosystemPage() {
  const { data, error } = useConfig()
  const [showAllUtilities, setShowAllUtilities] = useState(false)
  const address = data?.token.contractAddress ?? ""
  const canCheck = data?.chainId === 4663 && /^0x[a-fA-F0-9]{40}$/.test(address)
  const { data: verification } = useSWR<TokenVerification>(
    canCheck ? `/api/token-verification/${address}` : null,
    fetchTokenVerification,
    { refreshInterval: 60000, revalidateOnFocus: true, keepPreviousData: false },
  )
  if (!data) return error ? <ConfigError /> : <PageLoading />

  const { token } = data
  const isLive = token.launchStatus === "live"
  const isPaused = token.launchStatus === "paused"
  const hasContract = /^0x[a-fA-F0-9]{40}$/.test(token.contractAddress)
  const launchLabel = isPaused ? "Paused" : isLive && hasContract ? "Live" : isLive ? "Awaiting contract" : token.launchStatus === "preparing" ? "Preparing" : "Pre-launch"
  const purchaseReady = isLive && !isPaused && hasContract && data.features.showBuyButton && token.purchase.enabled && /^https:\/\//i.test(token.purchase.url)
  const tokenDescription = isLive && token.description === "The official pre-launch token for the HOOKLABS hook intelligence ecosystem."
    ? "Explore token details, launch status and on-chain activity."
    : token.description

  const onChainSymbol = verification?.deployed ? verification.token?.symbol ?? null : null
  const isPonsVerified = verification?.pons?.verified === true
  // Keep official HOOKLB supply separate from the configured test contract.
  const isOfficialContract = Boolean(onChainSymbol && onChainSymbol.toLowerCase() === token.ticker.toLowerCase() && isPonsVerified)
  const onChainSupply = verification?.deployed && verification.token?.totalSupply != null
    ? `${formatTokenAmount(verification.token.totalSupply)} ${onChainSymbol || "tokens"}`
    : null
  const expectedSupply = token.tokenomics.totalSupply?.trim() || "To be announced"
  const supplyToShow = isOfficialContract && onChainSupply ? onChainSupply : expectedSupply
  const supplySource = isOfficialContract && onChainSupply ? "On-chain supply" : "Expected supply"
  const rawLaunchVersion = token.launchVersion === "v2" ? "Pons V2" : token.launchVersion === "v1" ? "Pons V1" : "To be announced"
  const launchPlatform = token.launchPlatform || "Ponsfamily"
  const launchMechanismLabel = isPonsVerified ? "Pons V2" : rawLaunchVersion
  const liquidityLabel = isPonsVerified ? "Bonding curve → Uniswap v4" : token.launchVersion === "v2" ? "Bonding curve → Uniswap v4 (expected)" : token.launchVersion === "v1" ? "Uniswap v3 (expected)" : "To be announced"
  // Fees belong to the configured CA; a different ticker must not hide valid Pons fee data.
  const tradingFees = isPonsVerified ? verification?.pons?.tradingFees : null
  const bpsToPercent = (bps: number) => `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`
  const tradingFeeLabel = tradingFees ? `${bpsToPercent(tradingFees.totalFeeBps)} (${bpsToPercent(tradingFees.baseFeeBps)} base + ${bpsToPercent(tradingFees.creatorTaxBps)} creator)` : "Not available"
  const poolFeeLabel = isPonsVerified && verification?.pons?.poolFee != null
    ? `${(verification.pons.poolFee / 10000).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`
    : "Not available"

  const roadmapPhases = data.roadmap.filter((phase) => phase.visible)
  const overallProgress = roadmapProgress(roadmapPhases)
  const utilityPriority = ["Ecosystem Participation", "Developer Ecosystem Incentives", "Community Initiatives"]
  const prioritizedUtilities = [
    ...utilityPriority.map((name) => token.utilities.find((utility) => utility.name === name)).filter((value): value is (typeof token.utilities)[number] => Boolean(value)),
    ...token.utilities.filter((utility) => !utilityPriority.includes(utility.name)),
  ]
  const displayedUtilities = showAllUtilities ? prioritizedUtilities : prioritizedUtilities.slice(0, 3)

  const panel = "rounded-2xl border border-white/[.16] bg-[linear-gradient(145deg,rgba(19,32,43,.86),rgba(8,13,19,.96)_65%)] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_14px_44px_rgba(0,0,0,.2)]"

  return (
    <main className="mx-auto max-w-[1480px] space-y-4 px-3 pb-16 pt-5 sm:px-6 lg:space-y-5 lg:pt-6">
      {/* Compact hero: no duplicate launch information or administrative guidance. */}
      <section className="relative isolate overflow-hidden rounded-[1.65rem] border border-slate-400/35 bg-[#03101e]">
        {/* Decorative asset only; leave the existing live text and actions unchanged. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/images/token-hero/blue-wave.png')] bg-cover bg-center" />
        {/* Keep a quiet dark area behind the token heading and buttons. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,19,.96)_0%,rgba(3,12,23,.9)_30%,rgba(4,15,27,.62)_58%,rgba(4,13,24,.2)_100%)]" />
        <div className="relative grid min-h-[285px] items-center gap-4 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,.85fr)] lg:px-10 lg:py-7">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-sky-400"><span className="inline-block h-3 w-1.5 skew-[-22deg] bg-sky-400" />Token overview</p>
            <h1 className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight tracking-[-.05em]">
              <span>{token.name}</span><span className="text-primary">${token.ticker}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{tokenDescription}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {purchaseReady ? (
                <a href={token.purchase.url} target={token.purchase.openInNewTab ? "_blank" : undefined} rel={token.purchase.openInNewTab ? "noopener noreferrer" : undefined} className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl bg-primary px-5 text-primary-foreground shadow-[0_8px_28px_rgba(22,167,255,.18)] hover:bg-sky-300")}>{token.purchase.label}<ArrowRight className="size-4" /></a>
              ) : (
                <Button disabled size="lg" className="h-11 rounded-xl bg-slate-800 px-5 text-slate-400"><LockKeyhole className="size-4" />Buy unavailable</Button>
              )}
              {!token.hideViewChart && /^https:\/\//i.test(token.chartUrl) && <a href={token.chartUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-xl border-white/35 bg-black/25 px-5 text-white hover:bg-white/10")}>View chart<ExternalLink className="size-4" /></a>}
            </div>
          </div>
          <div className="pointer-events-none relative hidden h-[235px] items-center justify-center lg:flex" aria-hidden="true">
            {/* The supplied transparent artwork already includes the logo AND podium. */}
            <Image
              src="/images/token-hero/logo-podium.png"
              alt=""
              width={1411}
              height={1115}
              sizes="(max-width: 1024px) 0px, (max-width: 1440px) 34vw, 420px"
              className="relative h-full w-full max-w-[410px] object-contain object-center drop-shadow-[0_10px_28px_rgba(0,0,0,.32)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Historical chart follows the configured CA and remains visible independently of the Hero View chart button. */}
      <section aria-label="HOOKLB/WETH price chart" className="min-w-0">
        <HooklbMiniChart address={token.contractAddress} />
      </section>

      {/* Four different facts, each shown only once. */}
      <section aria-label="Token highlights" className={cn(panel, "grid grid-cols-2 divide-x-0 divide-y divide-white/10 p-3 sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:p-4")}>
        <TokenHighlight icon={CircleDot} label="Launch status" value={launchLabel} accent={launchLabel === "Live"} />
        <TokenHighlight icon={ShieldCheck} label={supplySource} value={supplyToShow} />
        <TokenHighlight icon={FlaskConical} label="Launch platform" value={isPonsVerified ? "Pons V2" : launchPlatform} />
        <TokenHighlight icon={Network} label="Network" value={token.network} />
      </section>

      {/* Single details block: no duplicate tokenomics/launch-parameters cards. */}
      <section className={cn(panel, "grid gap-0 p-5 sm:p-6 lg:grid-cols-2 lg:gap-8")}>
        <div className="min-w-0 lg:border-r lg:border-white/15 lg:pr-8">
          <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight"><Network className="size-5 text-primary" />Token details</h2>
          <div className="mt-4 divide-y divide-white/10">
            <TokenDetail label="Distribution" value={launchMechanismLabel === "To be announced" ? launchMechanismLabel : `${launchMechanismLabel} launch`} />
            <TokenDetail label="Liquidity & graduation" value={liquidityLabel} />
            <TokenDetail label="Trading fee" value={tradingFeeLabel} emphasis={Boolean(tradingFees)} />
          </div>
          {hasContract && isPonsVerified && tradingFees && <p className="mt-2 text-[11px] text-slate-400">Fee rates from the configured contract address.</p>}
          {token.tokenomics.status === "proposed" && <p className="mt-3 text-xs text-slate-400">Tokenomics are proposed until confirmed.</p>}
        </div>
        <div className="mt-6 min-w-0 border-t border-white/15 pt-5 lg:mt-0 lg:border-t-0 lg:pt-0">
          <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight"><Copy className="size-5 text-primary" />Contract</h2>
          {hasContract ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-black/30 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-200" title={token.contractAddress}>{token.contractAddress}</span>
              <CopyAddress address={token.contractAddress} />
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">Contract address not available</p>}
          <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
            <TokenDetail label="Pool fee" value={poolFeeLabel} />
            {token.explorerUrl && /^https:\/\//i.test(token.explorerUrl) && <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 py-3 text-sm text-slate-200 transition-colors hover:text-primary"><span>View contract details</span><ExternalLink className="size-4" /></a>}
          </div>
        </div>
      </section>

      {token.utilities.length > 0 && (
        <section className="pt-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Ecosystem</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Proposed utility</h2></div>
            {token.utilities.length > 3 && <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => setShowAllUtilities((value) => !value)} aria-expanded={showAllUtilities}>{showAllUtilities ? "Show less" : `View all (${token.utilities.length})`}<ChevronDown className={cn("size-4 transition-transform", showAllUtilities && "rotate-180")} /></Button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {displayedUtilities.map((utility) => (
              <article key={utility.name} className={cn(panel, "flex min-h-[112px] items-start gap-4 p-4 sm:p-5")}>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[.055]">
                  <Image src={utility.iconUrl} alt="" width={38} height={38} className="size-9 object-contain" />
                </div>
                <div className="min-w-0"><h3 className="text-sm font-semibold leading-5">{utility.name}</h3>{utility.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{utility.description}</p>}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {roadmapPhases.length > 0 && (
        <section className={cn(panel, "p-5 sm:p-6")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><Map className="size-6 text-primary" /><div><h2 className="text-lg font-semibold tracking-tight">Roadmap</h2><p className="text-xs text-slate-400">Development milestones</p></div></div>
            <div className="flex items-center gap-4"><span className="text-lg font-semibold tabular-nums">{overallProgress}%</span><Link href="/roadmap" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/25 bg-black/20")}>View roadmap<ArrowRight className="size-4" /></Link></div>
          </div>
          <ProgressBar value={overallProgress} className="mt-5 h-1.5" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roadmapPhases.slice(0, 4).map((phase, index) => (
              <div key={phase.id} className="flex min-w-0 items-start gap-3">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold", phase.status === "Completed" ? "border-primary bg-primary text-primary-foreground" : "border-white/25 bg-black/25 text-slate-300")}>{phase.status === "Completed" ? <Check className="size-4" /> : index + 1}</span>
                <div className="min-w-0"><p className="text-[11px] font-medium leading-5 text-white">{phase.title.replace(/^Phase \d+\s*[—-]\s*/, "")}</p><p className="text-[10px] text-muted-foreground">{phase.status}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function TokenHighlight({ icon: Icon, label, value, accent = false }: { icon: typeof CircleDot; label: string; value: string; accent?: boolean }) {
  return <div className="flex min-w-0 items-center gap-3 px-2 py-3 sm:px-4 sm:py-1"><Icon className={cn("size-5 shrink-0", accent ? "text-emerald-400" : "text-primary")} /><div className="min-w-0"><p className="break-words text-sm font-semibold leading-5">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p></div></div>
}
function TokenDetail({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 py-3 text-sm"><span className="text-slate-400">{label}</span><span className={cn("min-w-0 break-words text-right font-medium", emphasis && "text-primary")}>{value}</span></div>
}

function formatTokenAmount(value: string) {
  const [whole, fractional = ""] = value.split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const trimmed = fractional.slice(0, 4).replace(/0+$/, "")
  return trimmed ? `${grouped}.${trimmed}` : grouped
}
function launchMechanism(version: SiteConfig["token"]["launchVersion"]) { return version === "v1" ? "Pons V1" : version === "v2" ? "Pons V2" : "To be announced" }
function allocationGradient(allocations: SiteConfig["token"]["tokenomics"]["allocations"]) { let cursor = 0; return `conic-gradient(${allocations.map((item, index) => { const start = cursor; cursor += item.percentage; return `var(--chart-${index % 5 + 1}) ${start}% ${cursor}%` }).join(",")})` }
function InfoRow({ icon: Icon, label, value, mono = false }: { icon: typeof Network; label: string; value: string; mono?: boolean }) { return <div className="flex items-start gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn("mt-1 break-all text-sm", mono && "font-mono")}>{value}</p></div></div> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-background/40 p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-medium">{value}</p></div> }

const statusStyle = {
  Completed: "border-sky-400/35 bg-sky-400/10 text-sky-300",
  "In Progress": "border-amber-400/35 bg-amber-400/10 text-amber-300",
  Planned: "border-slate-400/25 bg-slate-400/[.07] text-slate-300",
  Delayed: "border-red-400/35 bg-red-400/10 text-red-300",
}
function statusValue(status: SiteConfig["roadmap"][number]["status"]) { return status === "Completed" ? 1 : status === "In Progress" ? 0.5 : 0 }
function phaseProgress(phase: SiteConfig["roadmap"][number]) { const items = phase.milestones.filter((item) => item.visible); const weight = items.reduce((sum, item) => sum + item.weight, 0); return weight ? Math.round(items.reduce((sum, item) => sum + item.weight * statusValue(item.status), 0) / weight * 100) : 0 }
function roadmapProgress(phases: SiteConfig["roadmap"]) { const items = phases.filter((phase) => phase.visible).flatMap((phase) => phase.milestones.filter((item) => item.visible)); const weight = items.reduce((sum, item) => sum + item.weight, 0); return weight ? Math.round(items.reduce((sum, item) => sum + item.weight * statusValue(item.status), 0) / weight * 100) : 0 }
function ProgressBar({ value, className }: { value: number; className?: string }) { return <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}><div className="h-full rounded-full bg-primary shadow-[0_0_16px_var(--primary)] transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${value}%` }} /></div> }

// Shared palette for the Roadmap and Community cards. Kept local so the rest of
// the project (including the token page) keeps its existing styling.
const ecosystemPanel = "relative overflow-hidden rounded-[22px] border border-slate-400/30 bg-[radial-gradient(ellipse_at_95%_105%,rgba(22,167,255,.11),transparent_48%),linear-gradient(145deg,#14232d_0%,#0c171f_52%,#080f16_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.055),0_16px_46px_rgba(0,0,0,.27)]"
const ecosystemInner = "rounded-xl border border-slate-400/20 bg-[linear-gradient(125deg,rgba(20,33,44,.7),rgba(7,15,22,.8))]"

export function RoadmapEcosystemPage() {
  const { data, error } = useConfig()
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!data) return error ? <ConfigError /> : <PageLoading />
  const phases = data.roadmap.filter((phase) => phase.visible)
  const progress = roadmapProgress(phases)

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-10 sm:px-6">
      <header className="text-center">
        <Badge variant="outline" className="border-primary/30 text-primary"><Sparkles />Interactive development path</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl sm:text-6xl">Building toward the <span className="text-primary">HOOKLB launch.</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">Statuses, dates, visibility, and weighting are managed in public/config.json. Planned work is never presented as complete.</p>
        <div className="mx-auto mt-8 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-xs"><span>Weighted roadmap progress</span><span className="font-mono text-primary">{progress}%</span></div>
          <ProgressBar value={progress} />
        </div>
        <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Roadmap phases">
          {phases.map((phase, index) => (
            <a key={phase.id} href={`#${phase.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-slate-400/30 bg-[#0c1821]/80 px-3 text-slate-200 hover:border-sky-400/45 hover:bg-[#102332]")}>0{index + 1} {phase.title.replace(/^Phase \d+ — /, "")}</a>
          ))}
        </nav>
      </header>

      <div className="relative mt-14 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-gradient-to-b before:from-sky-400/60 before:via-slate-400/35 before:to-transparent lg:before:left-1/2">
        {phases.map((phase, index) => {
          const percentage = phaseProgress(phase)
          return (
            <section id={phase.id} key={phase.id} className={cn("roadmap-reveal relative mb-10 scroll-mt-24 pl-14 lg:grid lg:grid-cols-2 lg:gap-20 lg:pl-0", index % 2 === 1 && "lg:[&>article]:col-start-2")}>
              <div className="absolute left-0 top-7 z-10 flex size-10 items-center justify-center rounded-full border border-sky-400/55 bg-[#0a1924] text-xs font-semibold tabular-nums text-sky-300 shadow-[0_0_0_5px_rgba(8,15,22,.95)] lg:left-1/2 lg:-translate-x-1/2">
                {String(index + 1).padStart(2, "0")}
              </div>
              <article className={cn(ecosystemPanel, "group p-5 transition-colors duration-300 hover:border-sky-400/45 sm:p-6")}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/65 to-transparent" />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[.22em] text-sky-400">Phase {index + 1}</p>
                      <h2 className="mt-2 text-[clamp(1.2rem,2vw,1.5rem)] font-semibold leading-tight tracking-tight text-slate-50">{phase.title.replace(/^Phase \d+ — /, "")}</h2>
                    </div>
                    <StatusBadge status={phase.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{phase.description}</p>

                  <div className={cn(ecosystemInner, "mt-5 px-4 py-3")}>
                    <div className="mb-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-400">Weighted progress</span>
                      <span className="font-semibold tabular-nums text-sky-300">{percentage}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-500/20" role="progressbar" aria-label={`${phase.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-600 via-sky-400 to-cyan-300 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {phase.milestones.filter((item) => item.visible).map((item) => (
                      <div key={item.id} className={cn(ecosystemInner, "overflow-hidden transition-colors hover:border-sky-400/35")}>
                        <button
                          type="button"
                          className="flex min-h-12 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 sm:px-3.5"
                          onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                          aria-expanded={expanded === item.id}
                        >
                          <span className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            item.status === "Completed" ? "border-sky-400/55 bg-sky-400/20 text-sky-300" : "border-slate-400/35 bg-slate-400/[.07] text-slate-400",
                          )}>
                            {item.status === "Completed" ? <Check className="size-3.5" /> : <CircleDot className="size-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-slate-100">{item.title}</span>
                          <StatusBadge status={item.status} compact />
                          <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", expanded === item.id && "rotate-180 text-sky-300")} />
                        </button>
                        {expanded === item.id && (
                          <div className="border-t border-white/10 px-4 py-3 pl-[3.4rem] text-xs leading-5 text-slate-400">
                            <p>{item.description || "No additional detail has been published."}</p>
                            {item.targetDate && <p className="mt-2 flex items-center gap-1.5"><CalendarDays className="size-3 text-sky-400" />Target: {item.targetDate}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          )
        })}
      </div>
    </main>
  )
}

function StatusBadge({ status, compact = false }: { status: SiteConfig["roadmap"][number]["status"]; compact?: boolean }) {
  return <Badge variant="outline" className={cn("shrink-0 rounded-full font-medium", statusStyle[status], compact ? "px-2 py-0 text-[10px]" : "px-2.5 py-0.5 text-[11px]")}>{status}</Badge>
}

export function CommunityEcosystemPage() {
  const { data, error } = useConfig()
  const [category, setCategory] = useState("All")
  if (!data) return error ? <ConfigError /> : <PageLoading />
  const announcements = sortAnnouncements(data.announcements)
  const categories = ["All", ...Array.from(new Set(announcements.map((item) => item.category)))]
  const filtered = category === "All" ? announcements : announcements.filter((item) => item.category === category)

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-10 sm:px-6">
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-6">
        <Card className={cn(ecosystemPanel, "gap-0 py-0 ring-0")}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/65 to-transparent" />
          <CardHeader className="relative px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex size-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10"><Megaphone className="size-5 text-sky-300" /></div>
                <CardTitle className="mt-3 text-xl font-semibold tracking-tight text-slate-50">Project announcements</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-400">Published from public/config.json.</CardDescription>
              </div>
              <div className="flex max-w-full flex-wrap gap-2" aria-label="Announcement categories">
                {categories.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={category === item ? "default" : "outline"}
                    className={cn("rounded-full px-3 text-xs", category === item ? "bg-sky-400 text-[#04121d] hover:bg-sky-300" : "border-slate-400/25 bg-[#0b1923] text-slate-300 hover:border-sky-400/45 hover:bg-[#122a3a]")}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative flex flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {filtered.length ? filtered.map((item) => <AnnouncementCard key={item.id} item={item} />) : <EmptyState text="No official announcements have been published yet." />}
          </CardContent>
        </Card>

        <Card className={cn(ecosystemPanel, "gap-0 py-0 ring-0")}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/65 to-transparent" />
          <CardHeader className="relative px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex size-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10"><FlaskConical className="size-5 text-sky-300" /></div>
            <CardTitle className="mt-3 text-xl font-semibold tracking-tight text-slate-50">Community resources</CardTitle>
            <CardDescription className="mt-1 text-xs text-slate-400">Only administrator-verified destinations appear here.</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {data.community.resources.length ? data.community.resources.map((resource) => (
              <a
                key={resource.label}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(ecosystemInner, "flex min-h-14 items-center justify-between gap-3 p-4 text-sm text-slate-100 transition-all hover:border-sky-400/45 hover:bg-[#122c3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400")}
              >
                <span>{resource.label}</span><ExternalLink className="size-4 shrink-0 text-sky-300" />
              </a>
            )) : <EmptyState text="No community resources have been configured." />}
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/[.055] p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-100"><Info className="size-4 text-sky-300" />Verify every destination</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">HOOKLABS will never request private keys or seed phrases. Confirm links here before connecting a wallet.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function sortAnnouncements(items: SiteConfig["announcements"]) { return [...items].filter((item) => item.enabled).sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()) }
function AnnouncementCard({ item, compact = false }: { item: SiteConfig["announcements"][number]; compact?: boolean }) {
  return (
    <article className={cn(ecosystemInner, "p-4 transition-colors hover:border-sky-400/30 sm:p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {item.pinned && <Badge variant="outline" className="border-sky-400/35 bg-sky-400/10 text-sky-300">Pinned</Badge>}
          <Badge variant="secondary" className="bg-slate-400/10 text-slate-300">{item.category}</Badge>
          {item.priority !== "Normal" && <Badge variant="outline" className="border-slate-400/25 text-slate-300">{item.priority}</Badge>}
        </div>
        {item.publishedAt && <span className="text-xs text-slate-400">{item.publishedAt}</span>}
      </div>
      <h2 className="mt-3 text-base font-semibold tracking-tight text-slate-50 sm:text-lg">{item.title}</h2>
      {!compact && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{item.message}</p>}
      {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200">Read more<ExternalLink className="size-3.5" /></a>}
    </article>
  )
}
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-slate-400/25 bg-black/15 px-4 py-10 text-center text-sm text-slate-400">{text}</div> }
