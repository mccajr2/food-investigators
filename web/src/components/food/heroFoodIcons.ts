import appleUrl from "@/assets/foods/apple.png?url"
import applesauceUrl from "@/assets/foods/applesauce.png?url"
import bagelUrl from "@/assets/foods/bagel.png?url"
import bagelCreamCheeseUrl from "@/assets/foods/bagel_cream_cheese.png?url"
import bananaUrl from "@/assets/foods/banana.png?url"
import blueberryUrl from "@/assets/foods/blueberry.png?url"
import broccoliUrl from "@/assets/foods/broccoli.png?url"
import carrotUrl from "@/assets/foods/carrot.png?url"
import cheesePizzaUrl from "@/assets/foods/cheese_pizza.png?url"
import chickenNuggetsUrl from "@/assets/foods/chicken_nuggets.png?url"
import chickenTendersUrl from "@/assets/foods/chicken_tenders.png?url"
import cornUrl from "@/assets/foods/corn.png?url"
import darkChocolateUrl from "@/assets/foods/dark_chocolate.png?url"
import grapeUrl from "@/assets/foods/grape.png?url"
import pancakesChocChipUrl from "@/assets/foods/pancakes_choc_chip.png?url"
import pancakesPlainUrl from "@/assets/foods/pancakes_plain.png?url"
import ramenUrl from "@/assets/foods/ramen.png?url"
import raspberryUrl from "@/assets/foods/raspberry.png?url"
import softPretzelUrl from "@/assets/foods/soft_pretzel.png?url"
import spinachUrl from "@/assets/foods/spinach.png?url"
import strawberryUrl from "@/assets/foods/strawberry.png?url"
import sweetPotatoUrl from "@/assets/foods/sweet_potato.png?url"
import toastUrl from "@/assets/foods/toast.png?url"
import waffleUrl from "@/assets/foods/waffle.png?url"
import yogurtPlainUrl from "@/assets/foods/yogurt_plain.png?url"
import yogurtVanillaUrl from "@/assets/foods/yogurt_vanilla.png?url"

import type { FoodIconKey } from "@/api/types"

/** His top-10 eat list — product subset of static PNG masters. */
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

/** Remaining starters — static PNG masters (same sticker sheet as heroes). */
export const NON_HERO_FOOD_ICON_KEYS = [
  "apple",
  "bagel",
  "toast",
  "chicken_nuggets",
  "applesauce",
  "blueberry",
  "grape",
  "pancakes_plain",
  "waffle",
  "yogurt_vanilla",
  "carrot",
  "corn",
  "sweet_potato",
  "broccoli",
  "dark_chocolate",
  "spinach",
] as const satisfies readonly FoodIconKey[]

export type NonHeroFoodIconKey = (typeof NON_HERO_FOOD_ICON_KEYS)[number]

export type StaticFoodIconKey = HeroFoodIconKey | NonHeroFoodIconKey

/** Vite-resolved URLs for all starter PNG masters. */
export const STATIC_FOOD_ICON_URLS = {
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
  apple: appleUrl,
  bagel: bagelUrl,
  toast: toastUrl,
  chicken_nuggets: chickenNuggetsUrl,
  applesauce: applesauceUrl,
  blueberry: blueberryUrl,
  grape: grapeUrl,
  pancakes_plain: pancakesPlainUrl,
  waffle: waffleUrl,
  yogurt_vanilla: yogurtVanillaUrl,
  carrot: carrotUrl,
  corn: cornUrl,
  sweet_potato: sweetPotatoUrl,
  broccoli: broccoliUrl,
  dark_chocolate: darkChocolateUrl,
  spinach: spinachUrl,
} as const satisfies Record<StaticFoodIconKey, string>

/** @deprecated Prefer STATIC_FOOD_ICON_URLS — kept for existing hero tests. */
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

export function isHeroFoodIconKey(key: string): key is HeroFoodIconKey {
  return (HERO_FOOD_ICON_KEYS as readonly string[]).includes(key)
}

export function isNonHeroFoodIconKey(key: string): key is NonHeroFoodIconKey {
  return (NON_HERO_FOOD_ICON_KEYS as readonly string[]).includes(key)
}

export function isStaticFoodIconKey(key: string): key is StaticFoodIconKey {
  return isHeroFoodIconKey(key) || isNonHeroFoodIconKey(key)
}

export function heroFoodIconUrl(key: HeroFoodIconKey): string {
  return HERO_FOOD_ICON_URLS[key]
}

export function staticFoodIconUrl(key: StaticFoodIconKey): string {
  return STATIC_FOOD_ICON_URLS[key]
}
