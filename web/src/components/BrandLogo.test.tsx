import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  BRAND_LOGO_SMALL_SRC,
  BRAND_LOGO_SRC,
  BRAND_NAME,
  BrandLogo,
} from "@/components/BrandLogo"

describe("BrandLogo", () => {
  it("renders the full logo asset with accessible brand alt", () => {
    render(<BrandLogo />)

    const img = screen.getByRole("img", { name: BRAND_NAME })
    expect(img).toHaveAttribute("src", BRAND_LOGO_SRC)
    expect(img).toHaveAttribute("data-brand-logo", "full")
  })

  it("renders the small logo asset for compact chrome", () => {
    render(<BrandLogo variant="compact" />)

    const img = screen.getByRole("img", { name: BRAND_NAME })
    expect(img).toHaveAttribute("src", BRAND_LOGO_SMALL_SRC)
    expect(img).toHaveAttribute("data-brand-logo", "compact")
    expect(img.className).toContain("h-[7.5rem]")
    expect(img.className).toContain("max-w-[33rem]")
  })
})
