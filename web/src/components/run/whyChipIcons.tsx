/**
 * Why-chip illustrations — locked art direction:
 * docs/design/why-chip-art-brief.md
 *
 * Static React SVGs (offline AI-assisted / hand-polished). No runtime AI.
 */
import type { ReactElement, ReactNode } from "react"

import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"
import { cn } from "@/lib/utils"

/** Brand palette hexes from the art brief / FoodIcon. */
const B = {
  navy: "#153160",
  cream: "#F7F2E3",
  lime: "#7AB953",
  coral: "#DE4E4B",
  amber: "#E48E26",
  sky: "#5BB0D7",
  white: "#FFFEF8",
  crust: "#C56A1E",
} as const

type SvgProps = { className?: string }

function Frame({
  className,
  children,
  bg = B.cream,
  chip,
}: SvgProps & { children: ReactNode; bg?: string; chip?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden
      data-why-chip={chip}
      className={cn("size-10 shrink-0 md:size-12", className)}
    >
      <rect width="64" height="64" rx="14" fill={bg} />
      {children}
    </svg>
  )
}

/** Round face helper — polarity via mouth + optional blush. */
function Face({
  cx = 32,
  cy = 30,
  r = 16,
  fill,
  mood,
}: {
  cx?: number
  cy?: number
  r?: number
  fill: string
  mood: "happy" | "sad"
}) {
  const mouth =
    mood === "happy" ? (
      <path
        d={`M${cx - 7} ${cy + 4}c2 5 5 7 7 7s5-2 7-7`}
        fill="none"
        stroke={B.navy}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    ) : (
      <path
        d={`M${cx - 7} ${cy + 10}c2-4 5-5 7-5s5 1 7 5`}
        fill="none"
        stroke={B.navy}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    )
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={B.navy} strokeWidth="2" />
      <circle cx={cx - 5} cy={cy - 2} r="2.2" fill={B.navy} />
      <circle cx={cx + 5} cy={cy - 2} r="2.2" fill={B.navy} />
      {mouth}
    </>
  )
}

function Cracker({
  x = 18,
  y = 22,
  w = 28,
  h = 22,
  fill = B.amber,
}: {
  x?: number
  y?: number
  w?: number
  h?: number
  fill?: string
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={fill}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx={x + 8} cy={y + 7} r="1.6" fill={B.crust} />
      <circle cx={x + 18} cy={y + 11} r="1.6" fill={B.crust} />
      <circle cx={x + 10} cy={y + 15} r="1.6" fill={B.crust} />
      <circle cx={x + 20} cy={y + 6} r="1.6" fill={B.crust} />
    </>
  )
}

function TastyIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="tasty" bg="#FFF6E0">
      <Face fill={B.amber} mood="happy" />
      {/* tiny cookie crumb sparkles */}
      <circle cx="12" cy="18" r="2.5" fill={B.lime} />
      <circle cx="52" cy="20" r="2.5" fill={B.lime} />
    </Frame>
  )
}

function CrunchyIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="crunchy" bg="#E8F4D8">
      <Cracker />
      {/* bite mark */}
      <path
        d="M46 28c-4 2-6 6-6 10 4 0 8-2 10-6"
        fill={B.cream}
        stroke={B.navy}
        strokeWidth="1.5"
      />
      <path
        d="M48 18l3 5M52 22l5 1M48 26l4 3"
        fill="none"
        stroke={B.lime}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function SoftIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="soft" bg="#E8F6FB">
      {/* marshmallow / pillow */}
      <ellipse
        cx="32"
        cy="36"
        rx="20"
        ry="14"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
      />
      <ellipse cx="32" cy="30" rx="16" ry="10" fill="#FFF8F0" stroke={B.sky} strokeWidth="1.5" />
      <path
        d="M22 30c3 4 7 5 10 5s7-1 10-5"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="26" r="1.8" fill={B.navy} />
      <circle cx="40" cy="26" r="1.8" fill={B.navy} />
    </Frame>
  )
}

function SmellIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="yummy smell" bg="#E8F4D8">
      {/* nose */}
      <ellipse
        cx="32"
        cy="38"
        rx="12"
        ry="10"
        fill="#F5C9A8"
        stroke={B.navy}
        strokeWidth="2"
      />
      <ellipse cx="28" cy="40" rx="2" ry="3" fill={B.navy} />
      <ellipse cx="36" cy="40" rx="2" ry="3" fill={B.navy} />
      {/* pleasant wisps */}
      <path
        d="M22 22c0-8 10-8 10 0"
        fill="none"
        stroke={B.lime}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M34 18c0-7 10-7 10 0"
        fill="none"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="48" cy="16" r="3" fill={B.amber} />
    </Frame>
  )
}

function LooksIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="looks good" bg="#FFF6E0">
      {/* big friendly eye looking at strawberry */}
      <ellipse
        cx="24"
        cy="32"
        rx="12"
        ry="14"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx="26" cy="32" r="6" fill={B.sky} />
      <circle cx="28" cy="30" r="2" fill={B.white} />
      <circle cx="46" cy="34" r="10" fill={B.coral} stroke={B.navy} strokeWidth="2" />
      <path d="M46 20v6" stroke={B.lime} strokeWidth="3" strokeLinecap="round" />
      <path d="M42 24h8" stroke={B.lime} strokeWidth="2" strokeLinecap="round" />
    </Frame>
  )
}

function WarmIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="warm" bg="#FFF0D6">
      <circle cx="32" cy="32" r="11" fill={B.amber} stroke={B.navy} strokeWidth="2" />
      <circle cx="28" cy="30" r="1.8" fill={B.navy} />
      <circle cx="36" cy="30" r="1.8" fill={B.navy} />
      <path
        d="M27 35c2 3 4 4 5 4s3-1 5-4"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={32 + Math.cos(rad) * 15}
            y1={32 + Math.sin(rad) * 15}
            x2={32 + Math.cos(rad) * 22}
            y2={32 + Math.sin(rad) * 22}
            stroke={B.coral}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )
      })}
    </Frame>
  )
}

function ColdIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="cold" bg="#E4F4FB">
      {/* happy ice cube */}
      <rect
        x="18"
        y="20"
        width="28"
        height="28"
        rx="6"
        fill={B.sky}
        stroke={B.navy}
        strokeWidth="2"
        opacity="0.85"
      />
      <rect x="22" y="24" width="12" height="8" rx="2" fill={B.white} opacity="0.7" />
      <circle cx="26" cy="36" r="2" fill={B.navy} />
      <circle cx="38" cy="36" r="2" fill={B.navy} />
      <path
        d="M26 42c2 3 4 4 6 4s4-1 6-4"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function YuckyTasteIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="yucky taste" bg="#FFE8E4">
      <Face fill={B.coral} mood="sad" cy={28} />
      {/* tongue out */}
      <ellipse
        cx="32"
        cy="48"
        rx="7"
        ry="6"
        fill="#F08080"
        stroke={B.navy}
        strokeWidth="1.5"
      />
    </Frame>
  )
}

function TooCrunchyIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="too crunchy" bg="#FFE8E4">
      <Cracker fill={B.crust} y={18} />
      {/* coral X — too much */}
      <path
        d="M22 40 L42 54 M42 40 L22 54"
        stroke={B.coral}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function TooSoftIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="too soft" bg="#FFE8E4">
      {/* droopy mush puddle */}
      <ellipse
        cx="32"
        cy="42"
        rx="22"
        ry="10"
        fill={B.sky}
        stroke={B.navy}
        strokeWidth="2"
        opacity="0.75"
      />
      <ellipse
        cx="32"
        cy="34"
        rx="16"
        ry="8"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx="26" cy="32" r="1.8" fill={B.navy} />
      <circle cx="38" cy="32" r="1.8" fill={B.navy} />
      <path
        d="M26 38c2-2 4-3 6-3s4 1 6 3"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M48 22 L56 30 M56 22 L48 30"
        stroke={B.coral}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function YuckySmellIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="yucky smell" bg="#FFE8E4">
      <ellipse
        cx="32"
        cy="40"
        rx="12"
        ry="10"
        fill="#F5C9A8"
        stroke={B.navy}
        strokeWidth="2"
      />
      <ellipse cx="28" cy="42" rx="2" ry="3" fill={B.navy} />
      <ellipse cx="36" cy="42" rx="2" ry="3" fill={B.navy} />
      {/* stinky green wisps */}
      <path
        d="M20 24c2-8 12-6 10 2"
        fill="none"
        stroke={B.lime}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M36 20c2-7 12-5 10 3"
        fill="none"
        stroke={B.lime}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M44 14 L54 24 M54 14 L44 24"
        stroke={B.coral}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function LooksWeirdIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="looks weird" bg="#FFE8E4">
      <ellipse
        cx="28"
        cy="30"
        rx="11"
        ry="13"
        fill={B.white}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx="26" cy="28" r="4" fill={B.coral} />
      <circle cx="28" cy="26" r="1.5" fill={B.white} />
      {/* odd lumpy food */}
      <path
        d="M42 24c6 0 10 6 8 12-4 6-14 8-16 2-2-6 2-14 8-14z"
        fill={B.amber}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx="48" cy="32" r="2" fill={B.lime} />
      <circle cx="42" cy="36" r="2.5" fill={B.coral} />
      <path
        d="M24 44c2-2 6-2 8 0"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function TooHotIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="too hot" bg="#FFE4E0">
      {/* big flame */}
      <path
        d="M32 50c-10 0-14-10-10-20 4 4 6 2 6-4 0-6 4-10 8-12 0 8 4 10 6 14 6-2 8 6 4 14-2 4-8 8-14 8z"
        fill={B.coral}
        stroke={B.navy}
        strokeWidth="2"
      />
      <path
        d="M30 46c-2-4 0-8 2-10 1 3 3 4 4 6 2-1 3 2 1 5-1 2-4 3-7 -1z"
        fill={B.amber}
      />
      {/* sweat drop */}
      <path
        d="M50 22c0 4-4 6-4 6s-4-2-4-6 4-8 4-8 4 4 4 8z"
        fill={B.sky}
        stroke={B.navy}
        strokeWidth="1.5"
      />
    </Frame>
  )
}

function TooColdIcon(props: SvgProps) {
  return (
    <Frame {...props} chip="too cold" bg="#D6EEF8">
      <rect
        x="18"
        y="18"
        width="28"
        height="28"
        rx="6"
        fill={B.sky}
        stroke={B.navy}
        strokeWidth="2"
      />
      <circle cx="26" cy="30" r="2" fill={B.navy} />
      <circle cx="38" cy="30" r="2" fill={B.navy} />
      <path
        d="M26 40c2-3 4-4 6-4s4 1 6 4"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* shiver lines */}
      <path
        d="M10 28v12M14 26v16"
        stroke={B.coral}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M50 28v12M54 26v16"
        stroke={B.coral}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Frame>
  )
}

const WHY_CHIP_ICONS: Record<string, (props: SvgProps) => ReactElement> = {
  tasty: TastyIcon,
  crunchy: CrunchyIcon,
  soft: SoftIcon,
  "yummy smell": SmellIcon,
  "looks good": LooksIcon,
  warm: WarmIcon,
  cold: ColdIcon,
  "yucky taste": YuckyTasteIcon,
  "too crunchy": TooCrunchyIcon,
  "too soft": TooSoftIcon,
  "yucky smell": YuckySmellIcon,
  "looks weird": LooksWeirdIcon,
  "too hot": TooHotIcon,
  "too cold": TooColdIcon,
}

/** Unique why-chip labels across like / no / so_so (so_so reuses like∪no strings). */
export function allWhyChipLabels(): string[] {
  return [
    ...new Set([
      ...WHY_CHIPS_BY_LIKED.like,
      ...WHY_CHIPS_BY_LIKED.no,
      ...WHY_CHIPS_BY_LIKED.so_so,
    ]),
  ]
}

export function hasWhyChipIcon(chip: string): boolean {
  return Object.prototype.hasOwnProperty.call(WHY_CHIP_ICONS, chip)
}

export function WhyChipIcon({
  chip,
  className,
}: {
  chip: string
  className?: string
}) {
  const Icon = WHY_CHIP_ICONS[chip]
  if (!Icon) {
    return (
      <Frame className={className} bg={B.cream} chip={chip}>
        <circle cx="32" cy="32" r="10" fill={B.navy} opacity="0.2" />
      </Frame>
    )
  }
  return <Icon className={className} />
}
