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
    <Frame {...p} bg="#F8D6DC">
      <path d="M32 18c8 2 16 10 16 20 0 8-7 14-16 14S16 46 16 38c0-10 8-18 16-20z" fill="#E23B4A" />
      <path d="M24 18c4-6 12-6 16 0-5 2-11 2-16 0z" fill="#3F7A3C" />
      <circle cx="26" cy="34" r="1.5" fill="#fff" />
      <circle cx="34" cy="40" r="1.5" fill="#fff" />
      <circle cx="38" cy="30" r="1.5" fill="#fff" />
    </Frame>
  ),
  banana: (p) => (
    <Frame {...p} bg="#FFF1C9">
      <path
        d="M18 40c6 10 22 14 30 4 2-2 2-6 0-8-8 8-20 6-26-2-2 2-4 4-4 6z"
        fill="#F2C14E"
      />
      <path d="M46 34c2 0 4 2 4 4" stroke="#C9932A" strokeWidth="2" fill="none" />
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
    <Frame {...p} bg="#F3E2C8">
      <circle cx="32" cy="34" r="16" fill="#D2A06A" />
      <circle cx="32" cy="34" r="9" fill="#F7F2E8" />
      <circle cx="32" cy="34" r="4" fill="#F3E2C8" />
    </Frame>
  ),
  toast: (p) => (
    <Frame {...p} bg="#F6E4C8">
      <rect x="16" y="20" width="32" height="28" rx="8" fill="#E0B070" />
      <rect x="20" y="24" width="24" height="20" rx="4" fill="#F0D19A" />
    </Frame>
  ),
  ramen: (p) => (
    <Frame {...p} bg="#F8E6D8">
      <ellipse cx="32" cy="42" rx="18" ry="8" fill="#C46A3A" />
      <path d="M14 34c0-10 8-18 18-18s18 8 18 18" fill="#E08955" />
      <path d="M22 30c4 2 8 2 12 0M24 36c4 2 8 2 12 0" stroke="#F2C14E" strokeWidth="2" />
      <path d="M40 18v16M44 20v14" stroke="#222" strokeWidth="2" />
    </Frame>
  ),
  chicken_tenders: (p) => (
    <Frame {...p} bg="#F8E6D0">
      <rect x="18" y="22" width="10" height="26" rx="5" fill="#D2A06A" transform="rotate(-12 23 35)" />
      <rect x="30" y="20" width="10" height="28" rx="5" fill="#C9932A" transform="rotate(8 35 34)" />
      <rect x="40" y="24" width="10" height="24" rx="5" fill="#D2A06A" transform="rotate(-6 45 36)" />
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
    <Frame {...p} bg="#FFF1D6">
      <ellipse cx="32" cy="40" rx="18" ry="6" fill="#D2A06A" />
      <ellipse cx="32" cy="34" rx="18" ry="6" fill="#E0B070" />
      <ellipse cx="32" cy="28" rx="18" ry="6" fill="#F0D19A" />
      <circle cx="26" cy="28" r="2" fill="#4A2C1A" />
      <circle cx="36" cy="32" r="2" fill="#4A2C1A" />
      <circle cx="30" cy="36" r="2" fill="#4A2C1A" />
    </Frame>
  ),
  waffle: (p) => (
    <Frame {...p} bg="#FFF1D6">
      <rect x="16" y="18" width="32" height="32" rx="6" fill="#E0B070" />
      <path d="M16 29h32M16 40h32M27 18v32M38 18v32" stroke="#C9932A" strokeWidth="2" />
    </Frame>
  ),
  yogurt_plain: (p) => (
    <Frame {...p} bg="#E8F2F4">
      <path d="M22 20h20l4 28H18z" fill="#F7F7F2" stroke="#C5D0D4" strokeWidth="2" />
      <ellipse cx="32" cy="20" rx="10" ry="4" fill="#FFFFFF" stroke="#C5D0D4" strokeWidth="2" />
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
