import { describe, expect, it } from "vitest"

import { FOOD_ICON_KEYS } from "@/api/types"
import { HERO_FOOD_ICON_KEYS } from "@/components/food/FoodIcon"

/**
 * Keep web starter keys aligned with backend FoodIconKeys.ALL / Flyway seeds.
 * Backend currently seeds 26 system starters (20 original + 3 heroes + 3 taste examples).
 */
const EXPECTED_STARTER_COUNT = 26

describe("food icon allowlist sync", () => {
  it("exports every seeded starter key including bitter example foods", () => {
    expect(FOOD_ICON_KEYS).toHaveLength(EXPECTED_STARTER_COUNT)
    expect(FOOD_ICON_KEYS).toEqual(
      expect.arrayContaining([
        "cheese_pizza",
        "soft_pretzel",
        "raspberry",
        "broccoli",
        "dark_chocolate",
        "spinach",
        ...HERO_FOOD_ICON_KEYS,
      ]),
    )
  })
})
