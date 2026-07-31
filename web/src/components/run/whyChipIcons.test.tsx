import { describe, expect, it } from "vitest"

import {
  allWhyChipLabels,
  hasWhyChipIcon,
  WhyChipIcon,
} from "@/components/run/whyChipIcons"
import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"
import { render } from "@testing-library/react"

describe("whyChipIcons", () => {
  it("maps and renders a non-empty icon for every why-chip string", () => {
    const labels = allWhyChipLabels()
    const expected = new Set([
      ...WHY_CHIPS_BY_LIKED.like,
      ...WHY_CHIPS_BY_LIKED.no,
      ...WHY_CHIPS_BY_LIKED.so_so,
    ]).size
    expect(labels).toHaveLength(expected)

    for (const chip of labels) {
      expect(hasWhyChipIcon(chip), `missing icon for "${chip}"`).toBe(true)
      const { container, unmount } = render(<WhyChipIcon chip={chip} />)
      const svg = container.querySelector("svg")
      expect(svg, `no svg for "${chip}"`).not.toBeNull()
      expect(svg?.getAttribute("data-why-chip")).toBe(chip)
      expect(svg?.innerHTML.length, `empty svg for "${chip}"`).toBeGreaterThan(0)
      unmount()
    }
  })

  it("does not keep middling-only so_so icons", () => {
    for (const chip of [
      "kind of tasty",
      "weird texture",
      "okay smell",
      "looks okay",
      "not sure",
    ]) {
      expect(hasWhyChipIcon(chip), `stale icon for "${chip}"`).toBe(false)
    }
  })

  it("resolves an icon for every so_so chip (reused like/no art)", () => {
    for (const chip of WHY_CHIPS_BY_LIKED.so_so) {
      expect(hasWhyChipIcon(chip), `missing icon for so_so "${chip}"`).toBe(
        true,
      )
    }
  })

  it("uses distinct art for like vs no polarity pairs", () => {
    const pairs: Array<[string, string]> = [
      ["tasty", "yucky taste"],
      ["crunchy", "too crunchy"],
      ["soft", "too soft"],
      ["yummy smell", "yucky smell"],
      ["looks good", "looks weird"],
      ["warm", "too hot"],
      ["cold", "too cold"],
    ]
    for (const [likeChip, noChip] of pairs) {
      const like = render(<WhyChipIcon chip={likeChip} />)
      const likeHtml = like.container.querySelector("svg")?.innerHTML
      like.unmount()
      const no = render(<WhyChipIcon chip={noChip} />)
      const noHtml = no.container.querySelector("svg")?.innerHTML
      no.unmount()
      expect(likeHtml, `${likeChip} vs ${noChip}`).not.toEqual(noHtml)
    }
  })
})
