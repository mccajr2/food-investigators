import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { WelcomeOrientationPanel } from "@/components/auth/WelcomeOrientationPanel"

describe("WelcomeOrientationPanel", () => {
  it("shows tone-guided welcome copy and lay of the land", () => {
    render(<WelcomeOrientationPanel onDismiss={() => undefined} />)

    expect(
      screen.getByRole("heading", { name: "Welcome to Food Investigators" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/travel and eating out can feel heavy/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/not a replacement for therapy/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/investigating foods like science/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/taste, texture, smell, and look/i)).toBeInTheDocument()
    expect(screen.getByText(/Plan/)).toBeInTheDocument()
    expect(screen.getByText(/History \/ Insights/)).toBeInTheDocument()
    expect(
      screen.getByText(/You always Approve what goes on the calendar/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument()
  })

  it("calls onDismiss and shows loading/error states", async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const { rerender } = render(
      <WelcomeOrientationPanel onDismiss={onDismiss} />,
    )

    await user.click(screen.getByRole("button", { name: "Got it" }))
    expect(onDismiss).toHaveBeenCalledTimes(1)

    rerender(
      <WelcomeOrientationPanel
        onDismiss={onDismiss}
        dismissing
        error="Could not save. Try again."
      />,
    )
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not save. Try again.",
    )
  })
})
