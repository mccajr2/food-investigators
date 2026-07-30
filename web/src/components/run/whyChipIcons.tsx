import type { ReactElement, ReactNode } from "react"

import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"
import { cn } from "@/lib/utils"

/** Logo palette hexes aligned with FoodIcon brand art. */
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
}: SvgProps & { children: ReactNode; bg?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden
      className={cn("size-10 shrink-0 md:size-12", className)}
    >
      <rect width="64" height="64" rx="14" fill={bg} />
      {children}
    </svg>
  )
}

function TastyIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <circle cx="32" cy="34" r="18" fill={B.amber} />
      <path
        d="M22 36c3 5 8 7 10 7s7-2 10-7"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="24" cy="28" r="2.5" fill={B.navy} />
      <circle cx="40" cy="28" r="2.5" fill={B.navy} />
    </Frame>
  )
}

function CrunchyIcon(props: SvgProps) {
  return (
    <Frame {...props} bg="#E8F4D8">
      <path
        d="M18 44 L32 14 L46 44 Z"
        fill={B.lime}
        stroke={B.navy}
        strokeWidth="2"
      />
      <path d="M26 44 V34 M32 44 V28 M38 44 V34" stroke={B.navy} strokeWidth="2" />
    </Frame>
  )
}

function SoftIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="36" rx="20" ry="14" fill={B.sky} />
      <ellipse cx="32" cy="30" rx="16" ry="10" fill={B.white} />
      <path
        d="M20 30c4 4 8 5 12 5s8-1 12-5"
        fill="none"
        stroke={B.navy}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function SmellIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="40" rx="14" ry="10" fill={B.lime} />
      <path
        d="M24 28c0-8 16-8 16 0"
        fill="none"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M28 22c0-6 8-6 8 0"
        fill="none"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Frame>
  )
}

function LooksIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="32" rx="22" ry="14" fill={B.white} stroke={B.navy} strokeWidth="2" />
      <circle cx="32" cy="32" r="8" fill={B.sky} />
      <circle cx="34" cy="30" r="3" fill={B.white} />
    </Frame>
  )
}

function WarmIcon(props: SvgProps) {
  return (
    <Frame {...props} bg="#FFF0D6">
      <circle cx="32" cy="32" r="12" fill={B.amber} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 32 + Math.cos(rad) * 16
        const y1 = 32 + Math.sin(rad) * 16
        const x2 = 32 + Math.cos(rad) * 22
        const y2 = 32 + Math.sin(rad) * 22
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
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
    <Frame {...props} bg="#E4F4FB">
      <path
        d="M32 14 V50 M18 22 L46 42 M46 22 L18 42"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="4" fill={B.navy} />
    </Frame>
  )
}

function YuckyTasteIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <circle cx="32" cy="34" r="18" fill={B.coral} />
      <path
        d="M22 40c3-4 8-5 10-5s7 1 10 5"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M22 26 L26 30 M26 26 L22 30 M38 26 L42 30 M42 26 L38 30" stroke={B.navy} strokeWidth="2.5" strokeLinecap="round" />
    </Frame>
  )
}

function TooCrunchyIcon(props: SvgProps) {
  return (
    <Frame {...props} bg="#E8F4D8">
      <path d="M16 46 L32 12 L48 46 Z" fill={B.lime} stroke={B.navy} strokeWidth="2" />
      <path d="M24 28 L40 40 M40 28 L24 40" stroke={B.coral} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function TooSoftIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="40" rx="22" ry="10" fill={B.sky} opacity="0.7" />
      <ellipse cx="32" cy="34" rx="18" ry="8" fill={B.white} stroke={B.navy} strokeWidth="2" />
      <path d="M24 28 L40 40 M40 28 L24 40" stroke={B.coral} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function YuckySmellIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="42" rx="14" ry="9" fill={B.coral} />
      <path
        d="M24 30c2-8 14-8 16 0"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M28 18 L36 26 M36 18 L28 26" stroke={B.coral} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function LooksWeirdIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="32" rx="22" ry="14" fill={B.white} stroke={B.navy} strokeWidth="2" />
      <circle cx="26" cy="32" r="5" fill={B.coral} />
      <circle cx="40" cy="32" r="5" fill={B.amber} />
      <path d="M28 42 Q32 38 36 42" fill="none" stroke={B.navy} strokeWidth="2" strokeLinecap="round" />
    </Frame>
  )
}

function TooHotIcon(props: SvgProps) {
  return (
    <Frame {...props} bg="#FFE4E0">
      <path
        d="M28 44c0 6 8 6 8 0V22c0-4-8-4-8 0z"
        fill={B.coral}
        stroke={B.navy}
        strokeWidth="2"
      />
      <path d="M24 18c4-6 12-6 16 0" fill="none" stroke={B.amber} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function TooColdIcon(props: SvgProps) {
  return (
    <Frame {...props} bg="#E4F4FB">
      <path
        d="M32 14 V50 M18 22 L46 42 M46 22 L18 42"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M22 14 L42 14" stroke={B.coral} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function KindOfTastyIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <circle cx="32" cy="34" r="18" fill={B.amber} />
      <path
        d="M22 36c2 2 5 3 10 3s8-1 10-3"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="24" cy="28" r="2.5" fill={B.navy} />
      <circle cx="40" cy="28" r="2.5" fill={B.navy} />
    </Frame>
  )
}

function WeirdTextureIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <path
        d="M14 36c6-10 10 6 16-4s10 8 20-2"
        fill="none"
        stroke={B.navy}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="28" r="4" fill={B.lime} />
      <circle cx="36" cy="40" r="5" fill={B.sky} />
      <circle cx="46" cy="26" r="3.5" fill={B.amber} />
    </Frame>
  )
}

function OkaySmellIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="42" rx="12" ry="8" fill={B.lime} opacity="0.8" />
      <path
        d="M26 30c0-5 12-5 12 0"
        fill="none"
        stroke={B.sky}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="24" r="3" fill={B.amber} />
    </Frame>
  )
}

function LooksOkayIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <ellipse cx="32" cy="32" rx="20" ry="12" fill={B.white} stroke={B.navy} strokeWidth="2" />
      <circle cx="32" cy="32" r="6" fill={B.lime} />
    </Frame>
  )
}

function NotSureIcon(props: SvgProps) {
  return (
    <Frame {...props}>
      <circle cx="32" cy="32" r="18" fill={B.white} stroke={B.navy} strokeWidth="2" />
      <path
        d="M24 26c0-5 4-8 8-8s8 3 8 7c0 4-3 5-5 7"
        fill="none"
        stroke={B.navy}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="44" r="2.5" fill={B.navy} />
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
  "kind of tasty": KindOfTastyIcon,
  "weird texture": WeirdTextureIcon,
  "okay smell": OkaySmellIcon,
  "looks okay": LooksOkayIcon,
  "not sure": NotSureIcon,
}

/** Every v1 why-chip label (like / no / so_so). */
export function allWhyChipLabels(): string[] {
  return [
    ...WHY_CHIPS_BY_LIKED.like,
    ...WHY_CHIPS_BY_LIKED.no,
    ...WHY_CHIPS_BY_LIKED.so_so,
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
      <Frame className={className} bg={B.cream}>
        <circle cx="32" cy="32" r="10" fill={B.navy} opacity="0.2" />
      </Frame>
    )
  }
  return <Icon className={className} />
}
