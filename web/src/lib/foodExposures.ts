import type { Familiarity, FoodResponse } from "@/api/types"

/** Trim + case-fold — matches backend household exposure variant keys. */
export function normalizeVariantKey(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Plan slot familiarity default from household exposures.
 * Returns null when no food is selected (caller keeps empty-slot behavior).
 */
export function autofillFamiliarity(
  food: FoodResponse | null | undefined,
  variantNote: string,
): Familiarity | null {
  if (!food) {
    return null
  }
  const key = normalizeVariantKey(variantNote)
  const exposures = food.exposures ?? []
  const exact = exposures.find((row) => row.variantKey === key)
  if (exact) {
    return exact.familiarity
  }
  if (exposures.some((row) => row.familiarity === "safe")) {
    return "familiar_but_new"
  }
  return "truly_new"
}

export function variantKeysForFood(food: FoodResponse | null | undefined): string[] {
  if (!food) {
    return []
  }
  return (food.exposures ?? [])
    .map((row) => row.variantKey)
    .filter((key) => key.length > 0)
    .sort((a, b) => a.localeCompare(b))
}
