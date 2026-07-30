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
})
