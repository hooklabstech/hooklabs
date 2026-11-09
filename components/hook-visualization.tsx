"use client"

import Image from "next/image"
import { useState } from "react"
import { Activity, Braces, Layers3, LockKeyhole, ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const nodes = [
  { label: "BeforeSwap", detail: "Executes immediately before a swap", icon: LockKeyhole, x: "22%", y: "17%" },
  { label: "AfterSwap", detail: "Executes immediately after a swap", icon: Activity, x: "78%", y: "17%" },
  { label: "Initialize", detail: "Runs as a v4 pool initializes", icon: Braces, x: "21%", y: "61%" },
  { label: "ModifyLiquidity", detail: "Observes or modifies liquidity updates", icon: Layers3, x: "79%", y: "61%" },
]

export function HookVisualization() {
  const [active, setActive] = useState("BeforeSwap")
  return <div className="relative mx-auto aspect-[1.12/1] w-full max-w-[590px] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_52%,rgba(255,133,0,.25),transparent_36%),linear-gradient(180deg,rgba(255,133,0,.035),transparent)]" aria-label="Interactive Uniswap v4 hook permissions">
    <div className="grid-overlay absolute inset-0 opacity-20" />
    <div className="absolute left-1/2 top-1/2 size-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35 shadow-[0_0_48px_rgba(255,133,0,.12),inset_0_0_48px_rgba(255,133,0,.05)]" />
    <div className="absolute left-1/2 top-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/55 motion-safe:animate-[core-orbit_28s_linear_infinite]" />
    <div className="absolute left-1/2 top-[67%] h-[23%] w-[70%] -translate-x-1/2 rounded-[50%] border border-primary/45 bg-[radial-gradient(ellipse,rgba(255,133,0,.22),rgba(5,5,5,.78)_62%)] shadow-[0_0_46px_rgba(255,133,0,.24),inset_0_0_40px_rgba(255,133,0,.12)]" />
    <div className="absolute left-1/2 top-[70%] h-[13%] w-[54%] -translate-x-1/2 rounded-[50%] border border-primary/70 bg-background/80 shadow-[0_0_30px_rgba(255,133,0,.3)]" />
    <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2rem] border border-primary/80 bg-[linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,133,0,.16)_44%,rgba(5,5,5,.92))] shadow-[0_0_72px_rgba(255,133,0,.42),inset_0_0_34px_rgba(255,255,255,.1)] backdrop-blur-xl motion-safe:animate-[core-float_6s_ease-in-out_infinite] sm:size-48">
      <div className="absolute inset-2 rounded-[1.65rem] border border-white/15" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-45 flex-col items-center">
        <Image src="/images/hooklabs-mark.png" alt="" width={88} height={88} className="size-20 object-contain drop-shadow-[0_0_14px_rgba(255,133,0,.7)]" />
        <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[.2em] text-primary">v4 core</span>
      </div>
    </div>
    <svg className="absolute inset-0 size-full text-primary/70" viewBox="0 0 100 90" aria-hidden="true">
      <path d="M50 45 C38 24 31 18 22 17 M50 45 C62 24 69 18 78 17 M50 45 C34 52 24 57 16 61 M50 45 C66 52 76 57 84 61" fill="none" stroke="currentColor" strokeWidth=".36" />
      <circle cx="50" cy="45" r="29" fill="none" stroke="currentColor" strokeWidth=".24" strokeDasharray="1.4 2.4" />
      {[15, 31, 69, 85].map((cx) => <circle key={cx} cx={cx} cy={cx < 50 ? 28 : 63} r=".75" fill="currentColor" className="motion-safe:animate-pulse" />)}
    </svg>
    {nodes.map(({ label, detail, icon: Icon, x, y }) => <Tooltip key={label}><TooltipTrigger render={<button onMouseEnter={() => setActive(label)} onFocus={() => setActive(label)} className="absolute flex min-w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-xl border border-primary/55 bg-background/85 px-3 py-2.5 text-xs font-medium shadow-[0_0_22px_rgba(255,133,0,.12)] backdrop-blur-xl transition hover:-translate-y-[55%] hover:border-primary hover:text-primary" style={{ left: x, top: y }} aria-label={`${label}: ${detail}`} />}><Icon className="text-primary" />{label}</TooltipTrigger><TooltipContent><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></TooltipContent></Tooltip>)}
    <div className="absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-primary/35 bg-background/90 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-primary backdrop-blur"><ShieldCheck className="size-3" />Hook permission · {active}</div>
  </div>
}
