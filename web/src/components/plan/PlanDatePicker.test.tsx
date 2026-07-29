import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  formatPlanDateLabel,
  parseIsoLocalDate,
  PlanDatePicker,
  toIsoLocalDate,
} from "@/components/plan/PlanDatePicker"

describe("PlanDatePicker helpers", () => {
  it("round-trips local ISO dates without UTC shift", () => {
    expect(toIsoLocalDate(parseIsoLocalDate("2026-07-20"))).toBe("2026-07-20")
    expect(formatPlanDateLabel("2026-07-20")).toMatch(/Jul/)
  })
})

describe("PlanDatePicker", () => {
  it("selects an available day and reports ISO", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PlanDatePicker
        aria-label="Date"
        value=""
        onChange={onChange}
        minDate="2026-07-15"
        occupiedDates={["2026-07-20"]}
      />,
    )

    await user.click(screen.getByRole("button", { name: /July 22/i }))
    expect(onChange).toHaveBeenCalledWith("2026-07-22")
  })

  it("disables past and occupied days", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PlanDatePicker
        aria-label="Date"
        value=""
        onChange={onChange}
        minDate="2026-07-15"
        occupiedDates={["2026-07-20"]}
      />,
    )

    const pastDay = screen.getByRole("button", { name: /July 14/i })
    const occupied = screen.getByRole("button", { name: /July 20/i })
    expect(pastDay).toBeDisabled()
    expect(occupied).toBeDisabled()
    expect(screen.getByRole("button", { name: /July 15/i })).not.toBeDisabled()

    await user.click(pastDay)
    await user.click(occupied)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("keeps allowDate selectable when it appears occupied", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PlanDatePicker
        aria-label="Date"
        value="2026-07-20"
        onChange={onChange}
        minDate="2026-07-15"
        occupiedDates={["2026-07-20"]}
        allowDate="2026-07-20"
      />,
    )

    const ownDay = screen.getByRole("button", { name: /July 20/i })
    expect(ownDay).not.toBeDisabled()
    await user.click(screen.getByRole("button", { name: /July 22/i }))
    expect(onChange).toHaveBeenCalledWith("2026-07-22")
  })
})
