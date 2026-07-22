import type { ReactElement, ReactNode } from "react"

import type { FoodIconKey } from "@/api/types"
import {
  colorFromName,
  emojiForFoodName,
  initialsFromName,
  isCustomIconKey,
  labelFromIconKey,
} from "@/lib/generatedFoodIcon"
import { cn } from "@/lib/utils"

/** Logo palette hexes (from `--brand-*` oklch tokens) for inline SVG fills. */
const B = {
  navy: "#153160",
  cream: "#F7F2E3",
  lime: "#7AB953",
  coral: "#DE4E4B",
  amber: "#E48E26",
  sky: "#5BB0D7",
  white: "#FFFEF8",
  crust: "#C56A1E",
  chip: "#3A2A1C",
} as const

/** His top-10 eat list — logo-aligned art this PR. */
export const HERO_FOOD_ICON_KEYS = [
  "strawberry",
  "banana",
  "ramen",
  "bagel_cream_cheese",
  "yogurt_plain",
  "pancakes_choc_chip",
  "cheese_pizza",
  "soft_pretzel",
  "chicken_tenders",
  "raspberry",
] as const satisfies readonly FoodIconKey[]

export const FOOD_ICON_LABELS: Record<FoodIconKey, string> = {
  bagel_cream_cheese: "Bagel and cream cheese",
  ramen: "Instant ramen",
  chicken_tenders: "Chicken tenders",
  apple: "Apples",
  strawberry: "Strawberries",
  pancakes_choc_chip: "Chocolate chip pancakes",
  yogurt_plain: "Plain yogurt",
  bagel: "Bagel",
  toast: "Toast",
  chicken_nuggets: "Chicken nuggets",
  applesauce: "Applesauce",
  banana: "Banana",
  blueberry: "Blueberries",
  grape: "Grapes",
  pancakes_plain: "Plain pancakes",
  waffle: "Waffle",
  yogurt_vanilla: "Vanilla yogurt",
  carrot: "Carrot",
  corn: "Corn",
  sweet_potato: "Sweet potato",
  cheese_pizza: "Cheese pizza",
  soft_pretzel: "Soft pretzels",
  raspberry: "Raspberries",
}

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
    >
      <rect width="64" height="64" rx="16" fill={bg} />
      {children}
    </svg>
  )
}

const icons: Record<FoodIconKey, (props: SvgProps) => ReactElement> = {
  apple: (p) => (
    <Frame {...p} bg="#F3D5C8">
      <circle cx="32" cy="36" r="16" fill="#D94A3D" />
      <path d="M32 20c4 0 8-4 8-8-6 1-10 4-12 8z" fill="#3F7A3C" />
      <rect x="30" y="16" width="4" height="8" rx="2" fill="#6B3F2A" />
    </Frame>
  ),
  strawberry: (p) => (
    <Frame {...p} bg="#F8E4E2">
      <path
        d="M32 16c9 2 18 12 18 24 0 10-8 16-18 16S14 50 14 40c0-12 9-22 18-24z"
        fill={B.coral}
      />
      <path
        d="M32 16c9 2 18 12 18 24 0 10-8 16-18 16"
        fill="#C93C3A"
        opacity="0.35"
      />
      <path
        d="M22 18c5-8 15-8 20 0-6 3-14 3-20 0z"
        fill={B.lime}
      />
      <ellipse cx="28" cy="14" rx="3" ry="5" fill={B.lime} transform="rotate(-20 28 14)" />
      <ellipse cx="36" cy="14" rx="3" ry="5" fill={B.lime} transform="rotate(18 36 14)" />
      <circle cx="26" cy="34" r="1.6" fill={B.cream} />
      <circle cx="34" cy="42" r="1.6" fill={B.cream} />
      <circle cx="38" cy="30" r="1.6" fill={B.cream} />
      <circle cx="28" cy="44" r="1.4" fill={B.cream} />
      <circle cx="36" cy="36" r="1.4" fill={B.cream} />
    </Frame>
  ),
  banana: (p) => (
    <Frame {...p} bg="#FFF4DC">
      <path
        d="M16 38c4 12 24 18 34 6 3-3 2-8-1-10-10 10-24 8-30-2-2 2-4 4-3 6z"
        fill={B.amber}
      />
      <path
        d="M20 36c6 8 18 10 26 2"
        stroke="#F6C46A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 32c3 1 5 4 5 7"
        stroke={B.navy}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="17" cy="39" r="2.5" fill={B.navy} />
    </Frame>
  ),
  blueberry: (p) => (
    <Frame {...p} bg="#D9E4F8">
      <circle cx="24" cy="34" r="9" fill="#3C5FBF" />
      <circle cx="38" cy="28" r="9" fill="#4A6FD1" />
      <circle cx="40" cy="40" r="8" fill="#2F4E9E" />
      <circle cx="24" cy="28" r="2" fill="#E8F0FF" />
    </Frame>
  ),
  grape: (p) => (
    <Frame {...p} bg="#E8DCF5">
      <circle cx="28" cy="28" r="7" fill="#7B4BB8" />
      <circle cx="38" cy="32" r="7" fill="#6A3FA6" />
      <circle cx="30" cy="40" r="7" fill="#8A57C9" />
      <path d="M34 18c0 6-2 8-4 10" stroke="#3F7A3C" strokeWidth="3" fill="none" />
    </Frame>
  ),
  carrot: (p) => (
    <Frame {...p} bg="#FFE0C8">
      <path d="M30 18l4 0 8 34c-6 4-14 4-20 0z" fill="#F07D28" />
      <path d="M28 16c2-6 8-8 12-2-4 2-8 2-12 2z" fill="#3F7A3C" />
    </Frame>
  ),
  corn: (p) => (
    <Frame {...p} bg="#FFF4C8">
      <ellipse cx="32" cy="34" rx="12" ry="18" fill="#F2C14E" />
      <path d="M20 28c-4 4-4 16 0 22 4-2 6-10 6-16s-2-6-6-6z" fill="#3F7A3C" />
      <path d="M44 28c4 4 4 16 0 22-4-2-6-10-6-16s2-6 6-6z" fill="#3F7A3C" />
    </Frame>
  ),
  sweet_potato: (p) => (
    <Frame {...p} bg="#F8E0D2">
      <ellipse cx="32" cy="34" rx="18" ry="12" fill="#C46A3A" transform="rotate(-20 32 34)" />
      <ellipse cx="28" cy="32" rx="4" ry="2" fill="#E8A070" transform="rotate(-20 28 32)" />
    </Frame>
  ),
  bagel: (p) => (
    <Frame {...p} bg="#F3E2C8">
      <circle cx="32" cy="34" r="16" fill="#D2A06A" />
      <circle cx="32" cy="34" r="7" fill="#F7E7CF" />
      <circle cx="24" cy="28" r="1.5" fill="#6B3F2A" />
      <circle cx="38" cy="30" r="1.5" fill="#6B3F2A" />
      <circle cx="36" cy="40" r="1.5" fill="#6B3F2A" />
    </Frame>
  ),
  bagel_cream_cheese: (p) => (
    <Frame {...p} bg="#F4E8D4">
      <ellipse cx="32" cy="36" rx="20" ry="18" fill={B.amber} />
      <ellipse cx="32" cy="36" rx="20" ry="18" fill={B.crust} opacity="0.25" />
      <ellipse cx="32" cy="36" rx="8" ry="7" fill="#F4E8D4" />
      <path
        d="M18 30c4-6 10-8 16-6 6 2 10 2 14-1"
        stroke={B.white}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M20 38c5 4 12 5 18 2"
        stroke={B.cream}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="24" cy="26" r="1.4" fill={B.navy} opacity="0.45" />
      <circle cx="40" cy="28" r="1.4" fill={B.navy} opacity="0.45" />
      <circle cx="36" cy="44" r="1.4" fill={B.navy} opacity="0.45" />
    </Frame>
  ),
  toast: (p) => (
    <Frame {...p} bg="#F6E4C8">
      <rect x="16" y="20" width="32" height="28" rx="8" fill="#E0B070" />
      <rect x="20" y="24" width="24" height="20" rx="4" fill="#F0D19A" />
    </Frame>
  ),
  ramen: (p) => (
    <Frame {...p} bg="#FFE8D8">
      <ellipse cx="32" cy="46" rx="20" ry="7" fill={B.coral} />
      <path
        d="M12 36c0-12 9-20 20-20s20 8 20 20"
        fill={B.amber}
      />
      <path
        d="M14 36c2-10 9-16 18-16s16 6 18 16"
        fill="#F6B85A"
        opacity="0.55"
      />
      <path
        d="M20 32c5 3 10 3 16 0M22 38c4 2 10 2 14 0"
        stroke={B.cream}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="26" cy="28" r="3" fill={B.lime} />
      <circle cx="38" cy="30" r="2.5" fill={B.coral} />
      <path
        d="M42 14v22M48 16v20"
        stroke={B.navy}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Frame>
  ),
  chicken_tenders: (p) => (
    <Frame {...p} bg="#FFE9D4">
      <rect
        x="16"
        y="20"
        width="11"
        height="30"
        rx="5.5"
        fill={B.amber}
        transform="rotate(-14 21.5 35)"
      />
      <rect
        x="28"
        y="16"
        width="12"
        height="34"
        rx="6"
        fill="#F0A84A"
        transform="rotate(6 34 33)"
      />
      <rect
        x="40"
        y="22"
        width="11"
        height="28"
        rx="5.5"
        fill={B.amber}
        transform="rotate(-8 45.5 36)"
      />
      <ellipse cx="22" cy="24" rx="3" ry="2" fill="#F6C46A" transform="rotate(-14 22 24)" />
      <ellipse cx="34" cy="20" rx="3.5" ry="2" fill="#F8D090" transform="rotate(6 34 20)" />
      <path
        d="M48 48c4 2 8 1 10-2"
        stroke={B.coral}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Frame>
  ),
  chicken_nuggets: (p) => (
    <Frame {...p} bg="#F8E6D0">
      <ellipse cx="24" cy="34" rx="8" ry="10" fill="#D2A06A" />
      <ellipse cx="38" cy="30" rx="9" ry="8" fill="#C9932A" />
      <ellipse cx="36" cy="42" rx="8" ry="7" fill="#D2A06A" />
    </Frame>
  ),
  pancakes_plain: (p) => (
    <Frame {...p} bg="#FFF1D6">
      <ellipse cx="32" cy="40" rx="18" ry="6" fill="#D2A06A" />
      <ellipse cx="32" cy="34" rx="18" ry="6" fill="#E0B070" />
      <ellipse cx="32" cy="28" rx="18" ry="6" fill="#F0D19A" />
    </Frame>
  ),
  pancakes_choc_chip: (p) => (
    <Frame {...p} bg="#FFF3DC">
      <ellipse cx="32" cy="44" rx="20" ry="7" fill={B.crust} />
      <ellipse cx="32" cy="36" rx="20" ry="7" fill={B.amber} />
      <ellipse cx="32" cy="28" rx="20" ry="7" fill="#F0B85A" />
      <ellipse cx="32" cy="22" rx="18" ry="6" fill="#F6C97A" />
      <circle cx="24" cy="22" r="2.2" fill={B.chip} />
      <circle cx="34" cy="26" r="2.2" fill={B.chip} />
      <circle cx="28" cy="32" r="2" fill={B.chip} />
      <circle cx="38" cy="34" r="2" fill={B.chip} />
      <circle cx="30" cy="40" r="1.8" fill={B.chip} />
      <path
        d="M40 18c4-1 8 2 8 6"
        stroke={B.amber}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
    </Frame>
  ),
  waffle: (p) => (
    <Frame {...p} bg="#FFF1D6">
      <rect x="16" y="18" width="32" height="32" rx="6" fill="#E0B070" />
      <path d="M16 29h32M16 40h32M27 18v32M38 18v32" stroke="#C9932A" strokeWidth="2" />
    </Frame>
  ),
  yogurt_plain: (p) => (
    <Frame {...p} bg="#E6F3F7">
      <path
        d="M20 24h24l5 26a6 6 0 0 1-6 6H21a6 6 0 0 1-6-6z"
        fill={B.white}
        stroke={B.sky}
        strokeWidth="2"
      />
      <ellipse
        cx="32"
        cy="24"
        rx="12"
        ry="5"
        fill={B.cream}
        stroke={B.sky}
        strokeWidth="2"
      />
      <ellipse cx="32" cy="24" rx="7" ry="2.5" fill={B.white} />
      <path
        d="M24 38c3 4 13 4 16 0"
        stroke={B.sky}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Frame>
  ),
  yogurt_vanilla: (p) => (
    <Frame {...p} bg="#F4EEDF">
      <path d="M22 20h20l4 28H18z" fill="#FFF8E7" stroke="#E0D2B0" strokeWidth="2" />
      <ellipse cx="32" cy="20" rx="10" ry="4" fill="#FFFCF3" stroke="#E0D2B0" strokeWidth="2" />
    </Frame>
  ),
  applesauce: (p) => (
    <Frame {...p} bg="#F3E2C8">
      <path d="M20 24h24v20a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8z" fill="#E8B86D" />
      <ellipse cx="32" cy="24" rx="12" ry="5" fill="#F0D19A" />
      <circle cx="32" cy="36" r="6" fill="#D94A3D" opacity="0.35" />
    </Frame>
  ),
  cheese_pizza: (p) => (
    <Frame {...p} bg="#FFE8D6">
      <path d="M32 12L52 48H12z" fill={B.crust} />
      <path d="M32 18L46 44H18z" fill={B.amber} />
      <path d="M32 22L42 42H22z" fill="#F6C46A" />
      <circle cx="30" cy="32" r="2.2" fill={B.lime} />
      <circle cx="36" cy="38" r="2" fill={B.lime} />
      <circle cx="28" cy="40" r="1.8" fill={B.lime} />
      <path
        d="M24 36c3-2 6-1 8 1"
        stroke={B.cream}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
    </Frame>
  ),
  soft_pretzel: (p) => (
    <Frame {...p} bg="#FFF0DC">
      <path
        d="M20 40c-4-10 2-22 14-24 10-2 18 6 16 16-1 6-6 10-12 10-8 0-12-6-10-12 1-4 6-6 10-4"
        fill="none"
        stroke={B.amber}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 42c-2-8 4-18 12-20 8-2 14 4 13 12"
        fill="none"
        stroke={B.crust}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="28" cy="28" r="1.5" fill={B.cream} />
      <circle cx="36" cy="24" r="1.5" fill={B.cream} />
      <circle cx="40" cy="32" r="1.5" fill={B.cream} />
      <circle cx="32" cy="36" r="1.4" fill={B.cream} />
      <circle cx="24" cy="36" r="1.4" fill={B.cream} />
    </Frame>
  ),
  raspberry: (p) => (
    <Frame {...p} bg="#F8E2E8">
      <circle cx="26" cy="30" r="7" fill={B.coral} />
      <circle cx="36" cy="28" r="7" fill="#C93C4A" />
      <circle cx="30" cy="38" r="7" fill="#E45A58" />
      <circle cx="38" cy="38" r="6" fill={B.coral} />
      <circle cx="22" cy="38" r="5.5" fill="#C93C4A" />
      <circle cx="32" cy="24" r="5" fill="#E45A58" />
      <path
        d="M32 14c0 6-2 10-4 12"
        stroke={B.lime}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="30" cy="14" rx="4" ry="2.5" fill={B.lime} />
      <circle cx="26" cy="28" r="1.2" fill={B.cream} opacity="0.7" />
      <circle cx="34" cy="34" r="1.2" fill={B.cream} opacity="0.7" />
    </Frame>
  ),
}

type FoodIconProps = {
  iconKey: string
  /** Used when rendering a generated/custom icon. */
  name?: string
  className?: string
}

export function FoodIcon({ iconKey, name, className }: FoodIconProps) {
  const Icon = icons[iconKey as FoodIconKey]
  if (Icon) {
    return <Icon className={className} />
  }

  const label =
    name?.trim() ||
    (isCustomIconKey(iconKey) ? labelFromIconKey(iconKey) : iconKey)
  return <GeneratedFoodIcon name={label || "food"} className={className} />
}

function GeneratedFoodIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const emoji = emojiForFoodName(name)
  const bg = colorFromName(name || "food")

  if (emoji) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl text-[2rem] leading-none sm:text-[2.5rem]",
          className,
        )}
        style={{ backgroundColor: bg }}
        aria-hidden
      >
        {emoji}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-2xl text-lg font-semibold tracking-wide text-foreground/80",
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  )
}
