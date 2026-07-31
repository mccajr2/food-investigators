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
  NON_HERO_FOOD_ICON_KEYS,
} from "@/components/food/FoodIcon"
import {
  HERO_FOOD_ICON_URLS,
  isHeroFoodIconKey,
  isNonHeroFoodIconKey,
  isStaticFoodIconKey,
  STATIC_FOOD_ICON_URLS,
} from "@/components/food/heroFoodIcons"

const foodsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../assets/foods",
)

describe("FoodIcon", () => {
  it("covers every starter key as either hero or non-hero static PNG", () => {
    expect(FOOD_ICON_KEYS).toHaveLength(
      HERO_FOOD_ICON_KEYS.length + NON_HERO_FOOD_ICON_KEYS.length,
    )
    expect(HERO_FOOD_ICON_KEYS).toHaveLength(10)
    expect(NON_HERO_FOOD_ICON_KEYS).toHaveLength(16)
    for (const key of FOOD_ICON_KEYS) {
      expect(isStaticFoodIconKey(key)).toBe(true)
      expect(FOOD_ICON_LABELS[key].length).toBeGreaterThan(0)
    }
  })

  it("renders static PNG assets for all hero foods", () => {
    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(isHeroFoodIconKey(key)).toBe(true)
      expect(existsSync(join(foodsDir, `${key}.png`))).toBe(true)
      expect(readFileSync(join(foodsDir, `${key}.png`)).byteLength).toBeGreaterThan(
        100,
      )

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

  it("renders static PNG assets for all sixteen non-hero foods", () => {
    for (const key of NON_HERO_FOOD_ICON_KEYS) {
      expect(isNonHeroFoodIconKey(key)).toBe(true)
      expect(isHeroFoodIconKey(key)).toBe(false)
      expect(existsSync(join(foodsDir, `${key}.png`))).toBe(true)
      expect(existsSync(join(foodsDir, `${key}.svg`))).toBe(false)
      expect(readFileSync(join(foodsDir, `${key}.png`)).byteLength).toBeGreaterThan(
        100,
      )
      expect(STATIC_FOOD_ICON_URLS[key]).toMatch(new RegExp(`${key}\\.png`))

      const { container, unmount } = render(<FoodIcon iconKey={key} />)
      const img = container.querySelector("img")
      expect(img, `${key} should render static img`).toBeTruthy()
      expect(img?.getAttribute("data-food-icon")).toBe(key)
      expect(img?.getAttribute("data-food-icon-src")).toBe("static")
      expect(img?.getAttribute("src")).toBe(STATIC_FOOD_ICON_URLS[key])
      expect(img?.className).toContain("rounded-2xl")
      expect(container.querySelector("svg")).toBeNull()
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

  it("does not treat custom keys as static starter assets", () => {
    expect(isStaticFoodIconKey("custom_cucumber")).toBe(false)
    const { container, unmount } = render(
      <FoodIcon iconKey="custom_cucumber" name="Cucumber" />,
    )
    expect(container.querySelector("[data-food-icon-src='static']")).toBeNull()
    unmount()
  })

  it("prefers remote iconUrl over static and generated art", () => {
    const remoteUrl = "https://cdn.example.com/foods/custom_cucumber.png"
    const custom = render(
      <FoodIcon
        iconKey="custom_cucumber"
        iconUrl={remoteUrl}
        name="Cucumber"
      />,
    )
    const customImg = custom.container.querySelector("img")
    expect(customImg?.getAttribute("data-food-icon-src")).toBe("remote")
    expect(customImg?.getAttribute("src")).toBe(remoteUrl)
    expect(custom.container.textContent).not.toContain("🥒")
    custom.unmount()

    const starter = render(
      <FoodIcon iconKey="apple" iconUrl={remoteUrl} />,
    )
    const starterImg = starter.container.querySelector("img")
    expect(starterImg?.getAttribute("data-food-icon-src")).toBe("remote")
    expect(starterImg?.getAttribute("src")).toBe(remoteUrl)
    expect(starterImg?.getAttribute("src")).not.toBe(HERO_FOOD_ICON_URLS.apple)
    starter.unmount()
  })

  it("ignores blank iconUrl and falls back to local art", () => {
    const { container, unmount } = render(
      <FoodIcon iconKey="apple" iconUrl="   " />,
    )
    expect(container.querySelector("img")?.getAttribute("data-food-icon-src")).toBe(
      "static",
    )
    unmount()
  })
})
