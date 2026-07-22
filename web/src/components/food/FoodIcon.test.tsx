import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FOOD_ICON_KEYS } from "@/api/types"
import {
  FoodIcon,
  FOOD_ICON_LABELS,
  HERO_FOOD_ICON_KEYS,
} from "@/components/food/FoodIcon"

describe("FoodIcon", () => {
  it("includes the three new hero starter keys in the shared allowlist", () => {
    expect(FOOD_ICON_KEYS).toEqual(
      expect.arrayContaining(["cheese_pizza", "soft_pretzel", "raspberry"]),
    )
  })

  it("renders logo-aligned SVG art and labels for all ten hero foods", () => {
    expect(HERO_FOOD_ICON_KEYS).toHaveLength(10)

    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(FOOD_ICON_KEYS).toContain(key)
      expect(FOOD_ICON_LABELS[key].length).toBeGreaterThan(0)

      const { container, unmount } = render(<FoodIcon iconKey={key} />)
      const svg = container.querySelector("svg")
      expect(svg, `${key} should render inline SVG`).toBeTruthy()
      expect(svg?.querySelector("rect")).toBeTruthy()
      // Brand palette should appear in hero art (not leftover purple defaults).
      const markup = svg?.innerHTML ?? ""
      expect(
        /#DE4E4B|#E48E26|#7AB953|#5BB0D7|#153160|#F7F2E3|#C56A1E/.test(markup),
        `${key} should use brand palette fills`,
      ).toBe(true)
      unmount()
    }
  })

  it("still renders SVG for non-hero starter keys", () => {
    const { container } = render(<FoodIcon iconKey="apple" />)
    expect(container.querySelector("svg")).toBeTruthy()
  })
})
