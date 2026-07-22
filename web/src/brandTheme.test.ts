import { describe, expect, it } from "vitest"

import css from "./index.css?raw"
import html from "../index.html?raw"
import favicon from "../public/favicon.svg?raw"

describe("brand theme tokens", () => {
  it("documents logo palette tokens and brand fonts in index.css", () => {
    expect(css).toContain("--brand-navy")
    expect(css).toContain("--brand-cream")
    expect(css).toContain("--brand-lime")
    expect(css).toContain("--brand-coral")
    expect(css).toContain("--brand-amber")
    expect(css).toContain("--brand-sky")
    expect(css).toContain("--brand-display")
    expect(css).toContain("Fredoka")
    expect(css).toContain("Nunito")
    expect(css).toMatch(
      /\[data-theme="kitchen-run"\][\s\S]*--primary:\s*var\(--brand-navy\)/,
    )
    expect(css).toContain("--border: oklch(0.78 0.04 260)")
    expect(css).toContain("--card: oklch(1 0.005 90)")
    expect(css).toContain('nav[aria-label="Signed-in sections"]')
  })

  it("sets the document title to Food Investigators", () => {
    expect(html).toContain("<title>Food Investigators</title>")
    expect(html).not.toContain("<title>quickapp</title>")
  })

  it("uses a navy/lime favicon instead of the purple template mark", () => {
    expect(favicon).toContain("#1E3A6E")
    expect(favicon).toContain("#7BC143")
    expect(favicon).not.toContain("#863bff")
  })
})
