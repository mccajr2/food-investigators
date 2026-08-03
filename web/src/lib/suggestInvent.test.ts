import { describe, expect, it, vi } from "vitest"

import type { FoodResponse } from "@/api/types"
import {
  findSelectableByName,
  isInventSlot,
  resolveSuggestSlot,
  slotIsReady,
  type SuggestFoodSlot,
} from "@/lib/suggestInvent"

const apples: FoodResponse = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  householdId: null,
  system: true,
  sessionEligible: true,
  exposures: [],
}

const snack: FoodResponse = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa99",
  name: "Pickles",
  iconKey: "custom_pickles",
  householdId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  system: false,
  sessionEligible: false,
  exposures: [],
}

describe("suggestInvent helpers", () => {
  it("detects invent vs catalog readiness", () => {
    const invent: SuggestFoodSlot = {
      foodId: "",
      familiarity: "truly_new",
      variantNote: "spears",
      inventName: "Pickles",
    }
    const catalog: SuggestFoodSlot = {
      foodId: apples.id,
      familiarity: "safe",
      variantNote: "",
      inventName: null,
    }
    expect(isInventSlot(invent)).toBe(true)
    expect(isInventSlot(catalog)).toBe(false)
    expect(slotIsReady(invent)).toBe(true)
    expect(slotIsReady({ ...invent, inventName: null })).toBe(false)
    expect(slotIsReady(catalog)).toBe(true)
  })

  it("matches selectable foods by name ignoring case", () => {
    expect(findSelectableByName([apples, snack], "apples")?.id).toBe(apples.id)
    expect(findSelectableByName([apples, snack], "Pickles")).toBeUndefined()
  })

  it("creates food and upserts exposure for invent without catalog match", async () => {
    const created: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Pickles",
      iconKey: "custom_pickles",
      householdId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      system: false,
      sessionEligible: true,
      exposures: [],
    }
    const create = vi.fn().mockResolvedValue(created)
    const upsertExposure = vi.fn().mockResolvedValue({
      foodId: created.id,
      variantKey: "spears",
      familiarity: "truly_new",
      source: "manual",
    })

    const result = await resolveSuggestSlot(
      {
        foodId: "",
        familiarity: "truly_new",
        variantNote: "spears",
        inventName: "Pickles",
      },
      [apples],
      { create, upsertExposure },
    )

    expect(create).toHaveBeenCalledWith({
      name: "Pickles",
      iconKey: "custom_pickles",
      sessionEligible: true,
    })
    expect(upsertExposure).toHaveBeenCalledWith(created.id, {
      variantKey: "spears",
      familiarity: "truly_new",
    })
    expect(result.request.foodId).toBe(created.id)
    expect(result.createdFood).toEqual(created)
  })

  it("matches existing tasting food and still upserts exposure", async () => {
    const create = vi.fn()
    const upsertExposure = vi.fn().mockResolvedValue({
      foodId: apples.id,
      variantKey: "",
      familiarity: "familiar_but_new",
      source: "manual",
    })

    const result = await resolveSuggestSlot(
      {
        foodId: "",
        familiarity: "familiar_but_new",
        variantNote: "",
        inventName: "Apples",
      },
      [apples],
      { create, upsertExposure },
    )

    expect(create).not.toHaveBeenCalled()
    expect(upsertExposure).toHaveBeenCalledWith(apples.id, {
      variantKey: "",
      familiarity: "familiar_but_new",
    })
    expect(result.request.foodId).toBe(apples.id)
    expect(result.createdFood).toBeNull()
  })

  it("passes catalog slots through without foods writes", async () => {
    const create = vi.fn()
    const upsertExposure = vi.fn()

    const result = await resolveSuggestSlot(
      {
        foodId: apples.id,
        familiarity: "safe",
        variantNote: "Honeycrisp",
        inventName: null,
      },
      [apples],
      { create, upsertExposure },
    )

    expect(create).not.toHaveBeenCalled()
    expect(upsertExposure).not.toHaveBeenCalled()
    expect(result.request).toEqual({
      foodId: apples.id,
      familiarity: "safe",
      variantNote: "Honeycrisp",
    })
  })
})
