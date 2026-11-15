import Image from "next/image"

export function HookVisualization() {
  return <div className="relative mx-auto aspect-square w-full max-w-[430px]" aria-label="HOOKLABS v4 hooks premium mark">
    <Image src="/images/premium/hero-logo-3d-HD.png" alt="" fill sizes="(max-width: 1024px) 80vw, 430px" className="object-contain" priority />
    <div className="pointer-events-none absolute left-1/2 top-[39%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center motion-safe:animate-[premium-float_6s_ease-in-out_infinite]">
      <Image src="/images/premium/hooklabs-original-logo-HD.png" alt="HOOKLABS twin-hook mark" width={132} height={110} className="h-auto w-[104px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.7)] sm:w-[126px]" />
      <span className="-mt-1 font-mono text-[11px] font-semibold italic uppercase tracking-[.2em] text-foreground sm:text-xs">V4&nbsp;&nbsp;HOOKS</span>
    </div>
  </div>
}
