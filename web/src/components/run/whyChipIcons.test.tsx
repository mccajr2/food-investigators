import { describe, expect, it } from "vitest"

import {
  allWhyChipLabels,
  hasWhyChipIcon,
  WhyChipIcon,
} from "@/components/run/whyChipIcons"
import { render } from "@testing-library/react"

describe("whyChipIcons", () => {
  it("maps an icon for every v1 why chip label", () => {
    const labels = allWhyChipLabels()
    expect(labels.length).toBeGreaterThan(0)
    for (const chip of labels) {
      expect(hasWhyChipIcon(chip), `missing icon for "${chip}"`).toBe(true)
    }
  })

  it("renders svg graphic for a chip", () => {
    const { container } = render(<WhyChipIcon chip="crunchy" />)
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
