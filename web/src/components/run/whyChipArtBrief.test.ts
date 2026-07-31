import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"

const briefPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/design/why-chip-art-brief.md",
)

describe("why-chip art brief", () => {
  it("lists every locked why-chip string for offline generation", () => {
    const brief = readFileSync(briefPath, "utf8")
    for (const chips of Object.values(WHY_CHIPS_BY_LIKED)) {
      for (const chip of chips) {
        expect(brief, `brief missing chip "${chip}"`).toContain(`| ${chip} |`)
      }
    }
  })

  it("documents so_so as mixed polarity reuse, not middling-only art", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(brief).toMatch(/so_so[\s\S]*reuse/i)
    for (const chip of [
      "kind of tasty",
      "weird texture",
      "okay smell",
      "looks okay",
      "not sure",
    ]) {
      expect(brief, `stale middling row for "${chip}"`).not.toContain(
        `| ${chip} |`,
      )
    }
  })

  it("locks PNG sticker delivery with shared cream ground (hero-aligned)", () => {
    const brief = readFileSync(briefPath, "utf8")
    expect(brief).toContain("food-icon-art-brief.md")
    expect(brief).toContain("web/src/assets/why-chips/")
    expect(brief).toMatch(/PNG master ~256/)
    expect(brief).toContain("#F7F2E3")
    expect(brief).toMatch(/shared cream/i)
    expect(brief).toMatch(/no polarity-tinted tile/i)
    expect(brief).toMatch(/navy.*#153160/i)
    expect(brief).not.toMatch(/Prefer \*\*SVG\*\*/)
    expect(brief).not.toMatch(/Plain cream or softly tinted tile background/)
  })
})
