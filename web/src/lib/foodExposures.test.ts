import { describe, expect, it } from "vitest"

import type { FoodResponse } from "@/api/types"
import {
  autofillFamiliarity,
  normalizeVariantKey,
  variantKeysForFood,
} from "@/lib/foodExposures"

const bagel: FoodResponse = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08",
  name: "Bagel",
  iconKey: "bagel",
  householdId: null,
  system: true,
  sessionEligible: true,
  exposures: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08",
      variantKey: "bagelsaurus",
      familiarity: "safe",
      source: "manual",
    },
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08",
      variantKey: "trader joes",
      familiarity: "familiar_but_new",
      source: "manual",
    },
  ],
}

const plain: FoodResponse = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  householdId: null,
  system: true,
  sessionEligible: true,
  exposures: [],
}

describe("foodExposures", () => {
  it("normalizes variant keys", () => {
    expect(normalizeVariantKey("  Bagelsaurus  ")).toBe("bagelsaurus")
    expect(normalizeVariantKey("")).toBe("")
  })

  it("autofills exact exposure match", () => {
    expect(autofillFamiliarity(bagel, "Bagelsaurus")).toBe("safe")
    expect(autofillFamiliarity(bagel, "TRADER JOES")).toBe("familiar_but_new")
  })

  it("defaults to familiar_but_new when food has any safe exposure", () => {
    expect(autofillFamiliarity(bagel, "Iggy's")).toBe("familiar_but_new")
    expect(autofillFamiliarity(bagel, "")).toBe("familiar_but_new")
  })

  it("defaults to truly_new when food has no safe exposures", () => {
    expect(autofillFamiliarity(plain, "")).toBe("truly_new")
    expect(autofillFamiliarity(plain, "organic")).toBe("truly_new")
  })

  it("returns null when no food is selected", () => {
    expect(autofillFamiliarity(null, "")).toBeNull()
    expect(autofillFamiliarity(undefined, "x")).toBeNull()
  })

  it("lists known non-empty variant keys", () => {
    expect(variantKeysForFood(bagel)).toEqual(["bagelsaurus", "trader joes"])
    expect(variantKeysForFood(plain)).toEqual([])
  })
})
