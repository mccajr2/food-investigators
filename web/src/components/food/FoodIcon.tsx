import type { ReactElement, ReactNode } from "react"

import type { FoodIconKey } from "@/api/types"
import {
  HERO_FOOD_ICON_KEYS,
  heroFoodIconUrl,
  isHeroFoodIconKey,
} from "@/components/food/heroFoodIcons"
import {
  colorFromName,
  emojiForFoodName,
  initialsFromName,
  isCustomIconKey,
  labelFromIconKey,
} from "@/lib/generatedFoodIcon"
import { cn } from "@/lib/utils"

export { HERO_FOOD_ICON_KEYS } from "@/components/food/heroFoodIcons"

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
  broccoli: "Broccoli",
  dark_chocolate: "Dark chocolate",
  spinach: "Spinach",
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

/** Non-hero starters — heroes load static SVGs via `heroFoodIcons`. */
const icons: Partial<Record<FoodIconKey, (props: SvgProps) => ReactElement>> = {
  apple: (p) => (
    <Frame {...p} bg="#F3D5C8">
      <circle cx="32" cy="36" r="16" fill="#D94A3D" />
      <path d="M32 20c4 0 8-4 8-8-6 1-10 4-12 8z" fill="#3F7A3C" />
      <rect x="30" y="16" width="4" height="8" rx="2" fill="#6B3F2A" />
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
  toast: (p) => (
    <Frame {...p} bg="#F6E4C8">
      <rect x="16" y="20" width="32" height="28" rx="8" fill="#E0B070" />
      <rect x="20" y="24" width="24" height="20" rx="4" fill="#F0D19A" />
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
  waffle: (p) => (
    <Frame {...p} bg="#FFF1D6">
      <rect x="16" y="18" width="32" height="32" rx="6" fill="#E0B070" />
      <path d="M16 29h32M16 40h32M27 18v32M38 18v32" stroke="#C9932A" strokeWidth="2" />
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
  broccoli: (p) => (
    <Frame {...p} bg="#E4F0DC">
      <path d="M30 44v-12" stroke="#5A8A3E" strokeWidth="5" strokeLinecap="round" />
      <circle cx="24" cy="26" r="8" fill={B.lime} />
      <circle cx="34" cy="22" r="9" fill="#6AA84F" />
      <circle cx="40" cy="30" r="7" fill={B.lime} />
      <circle cx="28" cy="32" r="7" fill="#5F9E45" />
    </Frame>
  ),
  dark_chocolate: (p) => (
    <Frame {...p} bg="#EDE4D8">
      <rect x="14" y="22" width="36" height="24" rx="4" fill={B.chip} />
      <path d="M14 34h36" stroke={B.cream} strokeWidth="2" opacity="0.35" />
      <path d="M26 22v24M38 22v24" stroke={B.cream} strokeWidth="2" opacity="0.35" />
      <rect x="18" y="26" width="8" height="6" rx="1" fill="#5A4030" opacity="0.5" />
    </Frame>
  ),
  spinach: (p) => (
    <Frame {...p} bg="#E8F2E0">
      <ellipse cx="28" cy="30" rx="12" ry="16" fill={B.lime} transform="rotate(-25 28 30)" />
      <ellipse cx="38" cy="34" rx="11" ry="15" fill="#5F9E45" transform="rotate(20 38 34)" />
      <path
        d="M28 44c2-10 4-18 4-28"
        stroke="#3F7A3C"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </Frame>
  ),
}

type FoodIconProps = {
  iconKey: string
  /** Used when rendering a generated/custom icon. */
  name?: string
  className?: string
}

function HeroFoodIcon({
  iconKey,
  className,
}: {
  iconKey: (typeof HERO_FOOD_ICON_KEYS)[number]
  className?: string
}) {
  return (
    <img
      src={heroFoodIconUrl(iconKey)}
      alt=""
      aria-hidden
      data-food-icon={iconKey}
      data-food-icon-src="static"
      className={cn(
        "h-full w-full rounded-2xl object-contain",
        className,
      )}
    />
  )
}

export function FoodIcon({ iconKey, name, className }: FoodIconProps) {
  if (isHeroFoodIconKey(iconKey)) {
    return <HeroFoodIcon iconKey={iconKey} className={className} />
  }

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
