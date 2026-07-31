import type { FoodIconKey } from "@/api/types"
import {
  isStaticFoodIconKey,
  staticFoodIconUrl,
  type StaticFoodIconKey,
} from "@/components/food/heroFoodIcons"
import {
  colorFromName,
  emojiForFoodName,
  initialsFromName,
  isCustomIconKey,
  labelFromIconKey,
} from "@/lib/generatedFoodIcon"
import { cn } from "@/lib/utils"

export {
  HERO_FOOD_ICON_KEYS,
  NON_HERO_FOOD_ICON_KEYS,
  isHeroFoodIconKey,
  isNonHeroFoodIconKey,
  isStaticFoodIconKey,
} from "@/components/food/heroFoodIcons"

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

type FoodIconProps = {
  iconKey: string
  /** Shared object-store URL when present — preferred over bundled/generated art. */
  iconUrl?: string | null
  /** Used when rendering a generated/custom icon. */
  name?: string
  className?: string
}

function RemoteFoodIcon({
  iconKey,
  iconUrl,
  className,
}: {
  iconKey: string
  iconUrl: string
  className?: string
}) {
  return (
    <img
      src={iconUrl}
      alt=""
      aria-hidden
      data-food-icon={iconKey}
      data-food-icon-src="remote"
      className={cn("h-full w-full rounded-2xl object-contain", className)}
    />
  )
}

function StaticFoodIcon({
  iconKey,
  className,
}: {
  iconKey: StaticFoodIconKey
  className?: string
}) {
  return (
    <img
      src={staticFoodIconUrl(iconKey)}
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

export function FoodIcon({ iconKey, iconUrl, name, className }: FoodIconProps) {
  const remote = iconUrl?.trim()
  if (remote) {
    return (
      <RemoteFoodIcon iconKey={iconKey} iconUrl={remote} className={className} />
    )
  }

  if (isStaticFoodIconKey(iconKey)) {
    return <StaticFoodIcon iconKey={iconKey} className={className} />
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
