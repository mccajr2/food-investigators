import bagelCreamCheeseUrl from "@/assets/foods/bagel_cream_cheese.png?url"
import bananaUrl from "@/assets/foods/banana.png?url"
import cheesePizzaUrl from "@/assets/foods/cheese_pizza.png?url"
import chickenTendersUrl from "@/assets/foods/chicken_tenders.png?url"
import pancakesChocChipUrl from "@/assets/foods/pancakes_choc_chip.png?url"
import ramenUrl from "@/assets/foods/ramen.png?url"
import raspberryUrl from "@/assets/foods/raspberry.png?url"
import softPretzelUrl from "@/assets/foods/soft_pretzel.png?url"
import strawberryUrl from "@/assets/foods/strawberry.png?url"
import yogurtPlainUrl from "@/assets/foods/yogurt_plain.png?url"

import type { FoodIconKey } from "@/api/types"

/** His top-10 eat list — static PNG masters under `src/assets/foods/` (iOS-portable). */
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

export type HeroFoodIconKey = (typeof HERO_FOOD_ICON_KEYS)[number]

/** Vite-resolved URLs for committed hero PNG masters. */
export const HERO_FOOD_ICON_URLS = {
  strawberry: strawberryUrl,
  banana: bananaUrl,
  ramen: ramenUrl,
  bagel_cream_cheese: bagelCreamCheeseUrl,
  yogurt_plain: yogurtPlainUrl,
  pancakes_choc_chip: pancakesChocChipUrl,
  cheese_pizza: cheesePizzaUrl,
  soft_pretzel: softPretzelUrl,
  chicken_tenders: chickenTendersUrl,
  raspberry: raspberryUrl,
} as const satisfies Record<HeroFoodIconKey, string>

/** All heroes locked as PNG. */
export const HERO_FOOD_ICON_EXT: Record<HeroFoodIconKey, "png"> = {
  strawberry: "png",
  banana: "png",
  ramen: "png",
  bagel_cream_cheese: "png",
  yogurt_plain: "png",
  pancakes_choc_chip: "png",
  cheese_pizza: "png",
  soft_pretzel: "png",
  chicken_tenders: "png",
  raspberry: "png",
}

export function isHeroFoodIconKey(key: string): key is HeroFoodIconKey {
  return (HERO_FOOD_ICON_KEYS as readonly string[]).includes(key)
}

export function heroFoodIconUrl(key: HeroFoodIconKey): string {
  return HERO_FOOD_ICON_URLS[key]
}
