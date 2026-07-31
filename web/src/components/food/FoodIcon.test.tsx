import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FOOD_ICON_KEYS } from "@/api/types"
import {
  FoodIcon,
  FOOD_ICON_LABELS,
  HERO_FOOD_ICON_KEYS,
} from "@/components/food/FoodIcon"
import {
  HERO_FOOD_ICON_URLS,
  isHeroFoodIconKey,
} from "@/components/food/heroFoodIcons"

const foodsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../assets/foods",
)

describe("FoodIcon", () => {
  it("includes the three new hero starter keys in the shared allowlist", () => {
    expect(FOOD_ICON_KEYS).toEqual(
      expect.arrayContaining(["cheese_pizza", "soft_pretzel", "raspberry"]),
    )
  })

  it("renders static assets for all ten hero foods", () => {
    expect(HERO_FOOD_ICON_KEYS).toHaveLength(10)

    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(FOOD_ICON_KEYS).toContain(key)
      expect(FOOD_ICON_LABELS[key].length).toBeGreaterThan(0)
      expect(isHeroFoodIconKey(key)).toBe(true)

      const pngPath = join(foodsDir, `${key}.png`)
      const svgPath = join(foodsDir, `${key}.svg`)
      const hasPng = existsSync(pngPath)
      const hasSvg = existsSync(svgPath)
      expect(
        hasPng || hasSvg,
        `missing ${key}.png or ${key}.svg`,
      ).toBe(true)

      if (hasPng) {
        expect(readFileSync(pngPath).byteLength).toBeGreaterThan(100)
      } else {
        const fileSvg = readFileSync(svgPath, "utf8")
        expect(fileSvg).toContain('viewBox="0 0 64 64"')
        expect(
          /#DE4E4B|#E48E26|#7AB953|#5BB0D7|#153160|#F7F2E3|#C56A1E/.test(
            fileSvg,
          ),
          `${key} svg should use brand palette fills`,
        ).toBe(true)
      }

      const { container, unmount } = render(<FoodIcon iconKey={key} />)
      const img = container.querySelector("img")
      expect(img, `${key} should render static img`).toBeTruthy()
      expect(img?.getAttribute("data-food-icon")).toBe(key)
      expect(img?.getAttribute("data-food-icon-src")).toBe("static")
      expect(img?.getAttribute("src")).toBe(HERO_FOOD_ICON_URLS[key])
      expect(img?.className).toContain("rounded-2xl")
      expect(container.querySelector("svg")).toBeNull()
      unmount()
    }
  })

  it("locks all ten hero foods as PNG masters (iOS-portable)", () => {
    expect(HERO_FOOD_ICON_KEYS).toHaveLength(10)
    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(existsSync(join(foodsDir, `${key}.png`))).toBe(true)
      expect(existsSync(join(foodsDir, `${key}.svg`))).toBe(false)
      expect(HERO_FOOD_ICON_URLS[key]).toMatch(new RegExp(`${key}\\.png`))
    }
  })

  it("still renders SVG for non-hero starter keys including bitter examples", () => {
    for (const key of ["apple", "broccoli", "dark_chocolate", "spinach"] as const) {
      const { container, unmount } = render(<FoodIcon iconKey={key} />)
      expect(container.querySelector("svg"), `${key} should render SVG`).toBeTruthy()
      expect(container.querySelector("img")).toBeNull()
      expect(container.querySelector("[data-food-icon-src='static']")).toBeNull()
      unmount()
    }
  })

  it("keeps generatedFoodIcon path for custom keys (emoji + initials)", () => {
    const withEmoji = render(
      <FoodIcon iconKey="custom_cucumber" name="Cucumber" />,
    )
    expect(withEmoji.container.querySelector("svg")).toBeNull()
    expect(withEmoji.container.querySelector("img")).toBeNull()
    expect(withEmoji.container.textContent).toContain("🥒")
    withEmoji.unmount()

    const withInitials = render(
      <FoodIcon iconKey="custom_mystery_mash" name="Mystery mash" />,
    )
    expect(withInitials.container.querySelector("svg")).toBeNull()
    expect(withInitials.container.querySelector("img")).toBeNull()
    expect(withInitials.container.textContent).toContain("MM")
    withInitials.unmount()
  })

  it("does not treat non-hero starters as static hero assets", () => {
    const nonHero = FOOD_ICON_KEYS.filter((key) => !isHeroFoodIconKey(key))
    expect(nonHero.length).toBeGreaterThan(0)
    for (const key of nonHero) {
      const { container, unmount } = render(<FoodIcon iconKey={key} />)
      expect(
        container.querySelector("[data-food-icon-src='static']"),
        `${key} must not use static hero img`,
      ).toBeNull()
      unmount()
    }
  })
})
