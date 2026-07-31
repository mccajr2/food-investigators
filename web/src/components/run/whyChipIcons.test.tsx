import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  allWhyChipLabels,
  hasWhyChipIcon,
  WHY_CHIP_ICON_URLS,
  whyChipSlug,
  WhyChipIcon,
} from "@/components/run/whyChipIcons"
import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"

const whyChipsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../assets/why-chips",
)
const whyChipIconsSource = join(
  dirname(fileURLToPath(import.meta.url)),
  "whyChipIcons.tsx",
)

describe("whyChipIcons", () => {
  it("maps and renders a static PNG for every why-chip string", () => {
    const labels = allWhyChipLabels()
    const expected = new Set([
      ...WHY_CHIPS_BY_LIKED.like,
      ...WHY_CHIPS_BY_LIKED.no,
      ...WHY_CHIPS_BY_LIKED.so_so,
    ]).size
    expect(labels).toHaveLength(expected)
    expect(labels).toHaveLength(14)

    for (const chip of labels) {
      expect(hasWhyChipIcon(chip), `missing icon for "${chip}"`).toBe(true)
      const slug = whyChipSlug(chip)
      const pngPath = join(whyChipsDir, `${slug}.png`)
      expect(existsSync(pngPath), `missing ${slug}.png`).toBe(true)
      expect(readFileSync(pngPath).byteLength).toBeGreaterThan(100)
      expect(WHY_CHIP_ICON_URLS[chip]).toMatch(new RegExp(`${slug}\\.png`))

      const { container, unmount } = render(<WhyChipIcon chip={chip} />)
      const img = container.querySelector("img")
      expect(img, `no img for "${chip}"`).not.toBeNull()
      expect(img?.getAttribute("data-why-chip")).toBe(chip)
      expect(img?.getAttribute("data-why-chip-src")).toBe("static")
      expect(img?.getAttribute("src")).toBe(WHY_CHIP_ICON_URLS[chip])
      expect(img?.className).toContain("rounded-2xl")
      expect(container.querySelector("svg")).toBeNull()
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

  it("reuses like/no PNG assets for so_so with exactly 14 masters", () => {
    const pngFiles = readdirSync(whyChipsDir).filter((name) =>
      name.endsWith(".png"),
    )
    expect(pngFiles).toHaveLength(14)
    expect(Object.keys(WHY_CHIP_ICON_URLS)).toHaveLength(14)

    for (const chip of WHY_CHIPS_BY_LIKED.so_so) {
      expect(hasWhyChipIcon(chip), `missing icon for so_so "${chip}"`).toBe(
        true,
      )
      expect(WHY_CHIP_ICON_URLS[chip]).toBeTruthy()
      expect(existsSync(join(whyChipsDir, `${whyChipSlug(chip)}.png`))).toBe(
        true,
      )
    }
  })

  it("uses distinct art URLs for like vs no polarity pairs", () => {
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
      expect(WHY_CHIP_ICON_URLS[likeChip]).not.toEqual(
        WHY_CHIP_ICON_URLS[noChip],
      )
      const like = render(<WhyChipIcon chip={likeChip} />)
      const likeSrc = like.container.querySelector("img")?.getAttribute("src")
      like.unmount()
      const no = render(<WhyChipIcon chip={noChip} />)
      const noSrc = no.container.querySelector("img")?.getAttribute("src")
      no.unmount()
      expect(likeSrc, `${likeChip} vs ${noChip}`).not.toEqual(noSrc)
    }
  })

  it("drops inline React SVG icon implementations", () => {
    const source = readFileSync(whyChipIconsSource, "utf8")
    expect(source).not.toMatch(/<svg[\s>]/)
    expect(source).not.toMatch(/viewBox=/)
    expect(source).toContain("data-why-chip-src")
  })
})
