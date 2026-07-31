import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { HERO_FOOD_ICON_KEYS } from "@/components/food/FoodIcon"

const briefPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/design/food-icon-art-brief.md",
)

describe("food-icon art brief", () => {
  it("lists every hero iconKey for offline generation", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(HERO_FOOD_ICON_KEYS).toHaveLength(10)
    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(brief, `brief missing hero "${key}"`).toContain(`| ${key} |`)
    }
  })

  it("documents style anchors and PNG-first delivery for all heroes", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(brief).toMatch(/human-polish/i)
    expect(brief).toContain("web/src/assets/foods/")
    expect(brief).toMatch(/Style anchors/i)
    expect(brief).toContain("#F7F2E3")
    for (const key of HERO_FOOD_ICON_KEYS) {
      expect(brief, `brief missing locked ${key}`).toContain(`| ${key} |`)
      expect(brief).toContain(`${key}.png`)
    }
  })
})
