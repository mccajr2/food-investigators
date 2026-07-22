import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("keeps outline controls distinct from the cream page background", () => {
    render(
      <Button type="button" variant="outline">
        Close
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Close" })
    expect(button.className).toContain("bg-card")
    expect(button.className).toContain("border-primary/45")
    expect(button.className).not.toContain("bg-background")
  })

  it("gives primary actions a solid navy fill against cream", () => {
    render(
      <Button type="button" variant="default">
        Plan a night
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Plan a night" })
    expect(button.className).toContain("bg-primary")
    expect(button.className).toContain("text-primary-foreground")
  })
})
