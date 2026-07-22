import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  RunGameSymbol,
  type RunGameSymbolKind,
} from "@/components/run/RunGameSymbol"

const KINDS: RunGameSymbolKind[] = ["catch", "cross", "match", "surprise"]

describe("RunGameSymbol", () => {
  it("renders on-brand SVG for Catch, Cross, Match, and Surprise", () => {
    for (const kind of KINDS) {
      const { container, unmount } = render(
        <RunGameSymbol kind={kind} className="size-14" />,
      )
      const svg = container.querySelector("[data-run-game-symbol]")
      expect(svg, `${kind} should render SVG`).toBeTruthy()
      expect(svg?.tagName.toLowerCase()).toBe("svg")
      const markup = svg?.innerHTML ?? ""
      expect(
        /#DE4E4B|#E48E26|#7AB953|#5BB0D7|#153160|#F7F2E3/.test(markup),
        `${kind} should use brand palette fills`,
      ).toBe(true)
      unmount()
    }
  })

  it("does not use stock emoji glyphs", () => {
    for (const kind of KINDS) {
      const { container, unmount } = render(<RunGameSymbol kind={kind} />)
      expect(container.textContent).toBe("")
      expect(container.textContent).not.toMatch(/[🧺🐸🃏✨]/)
      unmount()
    }
  })
})
