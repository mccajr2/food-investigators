import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FoodsClient, SessionsClient } from "@/api"
import type { FoodResponse, SessionResponse } from "@/api/types"
import { PlanPage } from "@/components/plan/PlanPage"

const foods: FoodResponse[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
    name: "Apples",
    iconKey: "apple",
    householdId: null,
    system: true,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
    name: "Strawberries",
    iconKey: "strawberry",
    householdId: null,
    system: true,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13",
    name: "Blueberries",
    iconKey: "blueberry",
    householdId: null,
    system: true,
  },
]

const sampleSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "planned",
  foods: [
    {
      foodId: foods[0].id,
      name: "Apples",
      iconKey: "apple",
      familiarity: "likes",
      variantNote: "Honeycrisp",
      position: 1,
    },
    {
      foodId: foods[1].id,
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "truly_new",
      variantNote: null,
      position: 2,
    },
  ],
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-15T00:00:00Z",
}

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    ...overrides,
  } as SessionsClient
}

function mockFoodsClient(overrides: Partial<FoodsClient> = {}): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue(foods),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    ...overrides,
  } as FoodsClient
}

describe("PlanPage", () => {
  it("lists upcoming sessions and empty state", async () => {
    render(
      <PlanPage
        sessionsClient={mockSessionsClient()}
        foodsClient={mockFoodsClient()}
      />,
    )

    expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument()
    expect(screen.getByText(/No planned nights yet/)).toBeInTheDocument()
  })

  it("creates a planned night with two foods", async () => {
    const user = userEvent.setup()
    const create = vi.fn().mockResolvedValue(sampleSession)
    render(
      <PlanPage
        sessionsClient={mockSessionsClient({ create })}
        foodsClient={mockFoodsClient()}
      />,
    )

    await screen.findByRole("heading", { name: "Plan" })
    await user.click(screen.getByRole("button", { name: "Plan a night" }))

    const form = screen.getByRole("form", { name: "Plan a night" })
    await user.type(within(form).getByLabelText("Date"), "2026-07-20")
    await user.selectOptions(within(form).getByLabelText("Food 1 picker"), foods[0].id)
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "likes",
    )
    await user.type(within(form).getByLabelText("Food 1 variant note"), "Honeycrisp")
    await user.selectOptions(within(form).getByLabelText("Food 2 picker"), foods[1].id)
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "truly_new",
    )
    await user.click(within(form).getByRole("button", { name: "Save night" }))

    expect(create).toHaveBeenCalledWith({
      scheduledOn: "2026-07-20",
      foods: [
        {
          foodId: foods[0].id,
          familiarity: "likes",
          variantNote: "Honeycrisp",
        },
        {
          foodId: foods[1].id,
          familiarity: "truly_new",
          variantNote: null,
        },
      ],
    })
    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument()
  })

  it("edits and cancels an upcoming night", async () => {
    const user = userEvent.setup()
    const updated: SessionResponse = {
      ...sampleSession,
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new",
          variantNote: "TJ's",
          position: 1,
        },
        {
          foodId: foods[2].id,
          name: "Blueberries",
          iconKey: "blueberry",
          familiarity: "likes",
          variantNote: null,
          position: 2,
        },
      ],
    }
    const update = vi.fn().mockResolvedValue(updated)
    const cancel = vi.fn().mockResolvedValue({
      ...updated,
      status: "cancelled",
    })

    render(
      <PlanPage
        sessionsClient={mockSessionsClient({
          listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
          update,
          cancel,
        })}
        foodsClient={mockFoodsClient()}
      />,
    )

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    const form = screen.getByRole("form", { name: "Edit night" })
    const date = within(form).getByLabelText("Date")
    await user.clear(date)
    await user.type(date, "2026-07-22")
    await user.selectOptions(within(form).getByLabelText("Food 1 picker"), foods[1].id)
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "familiar_but_new",
    )
    const note = within(form).getByLabelText("Food 1 variant note")
    await user.clear(note)
    await user.type(note, "TJ's")
    await user.selectOptions(within(form).getByLabelText("Food 2 picker"), foods[2].id)
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "likes",
    )
    await user.click(within(form).getByRole("button", { name: "Save changes" }))

    expect(update).toHaveBeenCalledWith(sampleSession.id, {
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: foods[1].id,
          familiarity: "familiar_but_new",
          variantNote: "TJ's",
        },
        {
          foodId: foods[2].id,
          familiarity: "likes",
          variantNote: null,
        },
      ],
    })
    expect(await screen.findByText(/TJ's/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel night" }))
    expect(cancel).toHaveBeenCalledWith(sampleSession.id)
    await waitFor(() => {
      expect(screen.queryByText(/TJ's/)).not.toBeInTheDocument()
    })
  })

  it("surfaces load errors", async () => {
    render(
      <PlanPage
        sessionsClient={mockSessionsClient({
          listUpcoming: vi.fn().mockRejectedValue(new Error("Not signed in")),
        })}
        foodsClient={mockFoodsClient()}
      />,
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in")
  })
})
