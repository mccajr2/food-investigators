import { describe, expect, it } from "vitest"

import {
  collectBootstrapItems,
  emptyTastingSlots,
  type SignupSafeFoodRow,
} from "@/components/auth/SignupSafeFoodsNudge"
import {
  BOOTSTRAP_SAFES_MAX,
  SIGNUP_TASTING_SLOT_COUNT,
  SYSTEM_STARTER_NAMES,
} from "@/lib/systemStarterNames"

describe("SignupSafeFoodsNudge helpers", () => {
  it("starts with five empty tasting slots", () => {
    const slots = emptyTastingSlots()
    expect(slots).toHaveLength(SIGNUP_TASTING_SLOT_COUNT)
    expect(slots.every((row) => row.kind === "tasting" && row.name === "")).toBe(
      true,
    )
  })

  it("collects only non-empty rows and marks snacks", () => {
    const rows: SignupSafeFoodRow[] = [
      { key: "1", name: "  Apples  ", variantKey: " Honeycrisp ", kind: "tasting" },
      { key: "2", name: "   ", variantKey: "", kind: "tasting" },
      { key: "3", name: "Goldfish", variantKey: "", kind: "snack" },
    ]
    expect(collectBootstrapItems(rows)).toEqual([
      { name: "Apples", variantKey: "Honeycrisp", sessionEligible: true },
      { name: "Goldfish", variantKey: undefined, sessionEligible: false },
    ])
  })

  it("exposes starter names for typeahead within the API cap", () => {
    expect(SYSTEM_STARTER_NAMES).toContain("Apples")
    expect(SYSTEM_STARTER_NAMES).toHaveLength(26)
    expect(BOOTSTRAP_SAFES_MAX).toBe(10)
  })
})
