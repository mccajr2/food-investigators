import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FoodResponse } from "@/api/types"
import { PlanFoodCombobox } from "@/components/plan/PlanFoodCombobox"

const foods: FoodResponse[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
    name: "Apples",
    iconKey: "apple",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08",
    name: "Bagel",
    iconKey: "bagel",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
    name: "Strawberries",
    iconKey: "strawberry",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
]

describe("PlanFoodCombobox", () => {
  it("shows placeholder then selected food name", () => {
    const { rerender } = render(
      <PlanFoodCombobox
        label="Food 1"
        foods={foods}
        value=""
        onChange={vi.fn()}
      />,
    )
    expect(
      screen.getByRole("combobox", { name: "Food 1 picker" }),
    ).toHaveTextContent("Choose a food…")

    rerender(
      <PlanFoodCombobox
        label="Food 1"
        foods={foods}
        value={foods[0].id}
        onChange={vi.fn()}
      />,
    )
    expect(
      screen.getByRole("combobox", { name: "Food 1 picker" }),
    ).toHaveTextContent("Apples")
  })

  it("filters by name and selects a food id", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PlanFoodCombobox
        label="Food 1"
        foods={foods}
        value=""
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Food 1 picker" }))
    const list = screen.getByRole("listbox")
    expect(within(list).getByText("Apples")).toBeInTheDocument()
    expect(within(list).getByText("Bagel")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Food 1 search"), "bag")
    expect(within(list).getByText("Bagel")).toBeInTheDocument()
    expect(within(list).queryByText("Apples")).not.toBeInTheDocument()

    await user.click(within(list).getByText("Bagel"))
    expect(onChange).toHaveBeenCalledWith(foods[1].id)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("shows empty state when nothing matches", async () => {
    const user = userEvent.setup()
    render(
      <PlanFoodCombobox
        label="Food 1"
        foods={foods}
        value=""
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Food 1 picker" }))
    await user.type(screen.getByLabelText("Food 1 search"), "zzzz")
    expect(screen.getByText("No foods match")).toBeInTheDocument()
  })
})
