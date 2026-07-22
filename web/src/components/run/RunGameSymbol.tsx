import type { ReactElement, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Same logo hexes as FoodIcon — keep Catch/Cross/Match/Surprise marks on-brand. */
const B = {
  navy: "#153160",
  cream: "#F7F2E3",
  lime: "#7AB953",
  coral: "#DE4E4B",
  amber: "#E48E26",
  sky: "#5BB0D7",
  white: "#FFFEF8",
} as const

export type RunGameSymbolKind = "catch" | "cross" | "match" | "surprise"

type SvgProps = { className?: string }

function Frame({
  className,
  children,
  bg,
}: SvgProps & { children: ReactNode; bg: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden
      className={cn("h-full w-full", className)}
      data-run-game-symbol=""
    >
      <rect width="64" height="64" rx="16" fill={bg} />
      {children}
    </svg>
  )
}

const symbols: Record<RunGameSymbolKind, (props: SvgProps) => ReactElement> = {
  catch: (p) => (
    <Frame {...p} bg="#FFE8D6">
      {/* Basket */}
      <path
        d="M18 28h28l-3 22a6 6 0 0 1-6 5H27a6 6 0 0 1-6-5z"
        fill={B.amber}
      />
      <path
        d="M20 30h24l-2.5 18a4 4 0 0 1-4 3.5H26.5a4 4 0 0 1-4-3.5z"
        fill="#F0B85A"
      />
      <path
        d="M16 28c0-2 4-6 16-6s16 4 16 6"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Falling bite */}
      <circle cx="40" cy="16" r="6" fill={B.coral} />
      <path d="M40 10c2 0 4-2 4-4-3 0-5 2-6 4z" fill={B.lime} />
    </Frame>
  ),
  cross: (p) => (
    <Frame {...p} bg="#E8F6EA">
      {/* Lane pads */}
      <rect x="8" y="28" width="14" height="10" rx="3" fill={B.sky} opacity="0.55" />
      <rect x="25" y="28" width="14" height="10" rx="3" fill={B.cream} />
      <rect x="42" y="28" width="14" height="10" rx="3" fill={B.sky} opacity="0.55" />
      {/* Bubbly hopper */}
      <ellipse cx="32" cy="30" rx="10" ry="9" fill={B.lime} />
      <circle cx="28" cy="28" r="2" fill={B.navy} />
      <circle cx="36" cy="28" r="2" fill={B.navy} />
      <ellipse cx="32" cy="33" rx="3" ry="2" fill={B.navy} opacity="0.35" />
      <path
        d="M24 36c2 4 4 6 8 6s6-2 8-6"
        fill="none"
        stroke={B.lime}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Frame>
  ),
  match: (p) => (
    <Frame {...p} bg="#E8F2F8">
      <rect
        x="12"
        y="14"
        width="18"
        height="26"
        rx="4"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
        transform="rotate(-8 21 27)"
      />
      <rect
        x="34"
        y="18"
        width="18"
        height="26"
        rx="4"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
        transform="rotate(10 43 31)"
      />
      <circle cx="22" cy="26" r="4" fill={B.coral} />
      <circle cx="42" cy="30" r="4" fill={B.coral} />
      <circle cx="22" cy="36" r="2" fill={B.amber} />
      <circle cx="42" cy="40" r="2" fill={B.amber} />
    </Frame>
  ),
  surprise: (p) => (
    <Frame {...p} bg="#FFF0DC">
      <circle cx="32" cy="32" r="10" fill={B.amber} />
      <circle cx="32" cy="32" r="5" fill={B.cream} />
      <path
        d="M32 10v8M32 46v8M10 32h8M46 32h8M16 16l6 6M42 42l6 6M48 16l-6 6M16 48l6-6"
        stroke={B.coral}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="22" r="3" fill={B.sky} />
      <circle cx="46" cy="44" r="3" fill={B.lime} />
    </Frame>
  ),
}

type RunGameSymbolProps = {
  kind: RunGameSymbolKind
  className?: string
}

export function RunGameSymbol({ kind, className }: RunGameSymbolProps) {
  const Symbol = symbols[kind]
  return <Symbol className={className} />
}
