import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { FOOD_ICON_KEYS } from "@/api/types"
import {
  HERO_FOOD_ICON_KEYS,
  NON_HERO_FOOD_ICON_KEYS,
} from "@/components/food/FoodIcon"

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

  it("lists every non-hero starter iconKey for offline generation", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(NON_HERO_FOOD_ICON_KEYS).toHaveLength(16)
    expect(FOOD_ICON_KEYS).toHaveLength(
      HERO_FOOD_ICON_KEYS.length + NON_HERO_FOOD_ICON_KEYS.length,
    )
    for (const key of NON_HERO_FOOD_ICON_KEYS) {
      expect(FOOD_ICON_KEYS).toContain(key)
      expect(HERO_FOOD_ICON_KEYS as readonly string[]).not.toContain(key)
      expect(brief, `brief missing non-hero "${key}"`).toContain(`| ${key} |`)
    }
  })

  it("documents sibling distinctness for close catalog pairs", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(brief).toMatch(/Sibling distinctness/i)
    for (const fragment of [
      "bagel` vs `bagel_cream_cheese",
      "pancakes_plain` vs `pancakes_choc_chip",
      "yogurt_vanilla` vs `yogurt_plain",
      "chicken_nuggets` vs `chicken_tenders",
      "apple` vs `applesauce",
      "broccoli` vs `spinach",
    ]) {
      expect(brief, `brief missing distinctness for ${fragment}`).toContain(
        fragment,
      )
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
