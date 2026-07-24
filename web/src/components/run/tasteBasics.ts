import type { FoodIconKey, TasteBasic } from "@/api/types"

export const TASTE_BASIC_LABELS: Record<TasteBasic, string> = {
  sweet: "Sweet",
  salty: "Salty",
  bitter: "Bitter",
  sour: "Sour",
}

/** Fixed example icons on run taste toggles (not the food being tasted). */
export const TASTE_EXAMPLE_ICONS: Record<TasteBasic, FoodIconKey[]> = {
  sweet: ["banana", "strawberry", "pancakes_choc_chip"],
  salty: ["soft_pretzel", "cheese_pizza", "chicken_nuggets"],
  bitter: ["broccoli", "dark_chocolate", "spinach"],
  sour: ["yogurt_plain", "raspberry", "strawberry"],
}

export const TASTE_BASIC_OPTIONS: TasteBasic[] = [
  "sweet",
  "salty",
  "bitter",
  "sour",
]
