import Image from "next/image"

/**
 * HOOKLABS premium hero.
 * The artwork already includes a silver tile and podium; only the transparent
 * original mark and label are layered within the tile, not another square icon.
 */
export function HookVisualization() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[430px] shrink-0"
      aria-label="HOOKLABS Uniswap v4 hero illustration"
    >
      <Image
        src="/images/premium/hero-logo-3d-HD.png"
        alt="Silver HOOKLABS panel and pedestal"
        fill
        priority
        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 430px"
        className="object-contain"
      />

      {/* Align the original transparent twin-hook mark to the *face* of the
          silver panel (the tile face occupies roughly x=29–71%, y=20–68%
          of the supplied square artwork). Never put a second app-icon tile
          on top of this panel. */}
      <div className="pointer-events-none absolute inset-x-[30%] top-[30%] flex flex-col items-center gap-[3px]">
        <Image
          src="/images/premium/hooklabs-original-logo-HD.png"
          alt=""
          width={786}
          height={651}
          sizes="(max-width: 640px) 32vw, 170px"
          className="h-auto w-full object-contain drop-shadow-[0_4px_9px_rgba(0,0,0,.65)]"
        />
        <span className="whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[.17em] text-white/90 sm:text-[10px]">
          V4 HOOKS
        </span>
      </div>
    </div>
  )
}
