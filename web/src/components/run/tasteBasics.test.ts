import { describe, expect, it } from "vitest"

import {
  TASTE_BASIC_OPTIONS,
  TASTE_EXAMPLE_ICONS,
} from "@/components/run/tasteBasics"

describe("tasteBasics", () => {
  it("locks four tastes with 2–3 example icons each including bitter starters", () => {
    expect(TASTE_BASIC_OPTIONS).toEqual(["sweet", "salty", "bitter", "sour"])
    expect(TASTE_EXAMPLE_ICONS.bitter).toEqual([
      "broccoli",
      "dark_chocolate",
      "spinach",
    ])
    for (const taste of TASTE_BASIC_OPTIONS) {
      expect(TASTE_EXAMPLE_ICONS[taste].length).toBeGreaterThanOrEqual(2)
      expect(TASTE_EXAMPLE_ICONS[taste].length).toBeLessThanOrEqual(3)
    }
  })
})
