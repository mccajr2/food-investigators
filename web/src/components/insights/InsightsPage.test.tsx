import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { InsightsClient } from "@/api"
import type { InsightsResponse } from "@/api/types"
import { InsightsPage } from "@/components/insights/InsightsPage"

const notReady: InsightsResponse = {
  completedSessionCount: 1,
  ready: false,
  ateEnoughYes: 2,
  ateEnoughNo: 0,
  likedLike: 1,
  likedSoSo: 1,
  likedNo: 0,
  likedSkipped: 0,
  topLikedTextures: [],
  topLikedTastes: [],
  familiaritySafe: 2,
  familiarityFamiliarButNew: 0,
  familiarityTrulyNew: 0,
  snackCount: 2,
  hasParentNotes: false,
  recentWhyNotes: [],
  tips: [],
}

const ready: InsightsResponse = {
  completedSessionCount: 3,
  ready: true,
  ateEnoughYes: 4,
  ateEnoughNo: 2,
  likedLike: 5,
  likedSoSo: 1,
  likedNo: 0,
  likedSkipped: 0,
  topLikedTextures: ["crunchy", "soft"],
  topLikedTastes: ["salty"],
  familiaritySafe: 4,
  familiarityFamiliarButNew: 2,
  familiarityTrulyNew: 0,
  snackCount: 1,
  hasParentNotes: true,
  recentWhyNotes: [
    {
      scheduledOn: "2026-07-20",
      foodName: "Apples",
      liked: "like",
      whyNote: "tasty, crunchy — liked the peel",
    },
    {
      scheduledOn: "2026-07-19",
      foodName: "Broccoli",
      liked: "no",
      whyNote: "yucky smell",
    },
  ],
  tips: [
    {
      id: "lean_into_why_like",
      message: 'Likes often mention "crunchy" — lean into that when you pick foods.',
    },
    {
      id: "lean_into_taste",
      message: "Salty tastes seem to land — lean into that when you pick foods.",
    },
    {
      id: "mix_familiarity",
      message:
        "You've stuck to known foods — when you're ready, try one gentle familiar-but-new.",
    },
  ],
}

function mockClient(overrides: Partial<InsightsClient> = {}): InsightsClient {
  return {
    get: vi.fn().mockResolvedValue(ready),
    dismissTip: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as InsightsClient
}

describe("InsightsPage", () => {
  it("shows insufficient-data state when not ready", async () => {
    render(<InsightsPage client={mockClient({ get: vi.fn().mockResolvedValue(notReady) })} />)

    expect(await screen.findByRole("heading", { name: "Insights" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      /Not enough tasting nights yet/,
    )
    expect(screen.getByRole("status")).toHaveTextContent(/finished 1/)
    expect(screen.getByRole("status")).toHaveTextContent(/2 snacks tracked/)
    expect(screen.queryByRole("heading", { name: "Tips" })).not.toBeInTheDocument()
  })

  it("shows summaries and dismisses a tip", async () => {
    const user = userEvent.setup()
    const dismissTip = vi.fn().mockResolvedValue(undefined)
    render(<InsightsPage client={mockClient({ dismissTip })} />)

    expect(await screen.findByText("Nights completed")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(
      screen.getByText("4 Safe · 2 Familiar but new · 0 Truly new"),
    ).toBeInTheDocument()
    expect(screen.getByText("Crunchy, Soft")).toBeInTheDocument()
    expect(screen.getByText("Salty")).toBeInTheDocument()
    expect(screen.getByText("Some nights have notes")).toBeInTheDocument()

    const recentWhys = screen
      .getByRole("heading", { name: "Recent whys" })
      .closest("section")
    expect(recentWhys).not.toBeNull()
    expect(within(recentWhys!).getByText(/Apples/)).toBeInTheDocument()
    expect(
      within(recentWhys!).getByText(/tasty, crunchy — liked the peel/),
    ).toBeInTheDocument()
    expect(within(recentWhys!).getByText(/yucky smell/)).toBeInTheDocument()

    const tips = screen.getByRole("heading", { name: "Tips" }).closest("section")
    expect(tips).not.toBeNull()
    expect(within(tips!).getByText(/Likes often mention/)).toBeInTheDocument()
    expect(within(tips!).getByText(/Salty tastes seem to land/)).toBeInTheDocument()
    expect(within(tips!).getByText(/stuck to known foods/)).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: lean_into_taste" }),
    )

    expect(dismissTip).toHaveBeenCalledWith("lean_into_taste")
    await waitFor(() => {
      expect(screen.queryByText(/Salty tastes seem to land/)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/stuck to known foods/)).toBeInTheDocument()
    expect(screen.getByText("Salty")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: lean_into_why_like" }),
    )

    expect(dismissTip).toHaveBeenCalledWith("lean_into_why_like")
    await waitFor(() => {
      expect(screen.queryByText(/Likes often mention/)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/stuck to known foods/)).toBeInTheDocument()
  })

  it("shows empty recent whys copy when none recorded", async () => {
    render(
      <InsightsPage
        client={mockClient({
          get: vi.fn().mockResolvedValue({
            ...ready,
            recentWhyNotes: [],
            tips: [],
          }),
        })}
      />,
    )

    expect(await screen.findByRole("heading", { name: "Recent whys" })).toBeInTheDocument()
    expect(
      screen.getByText(/No why notes yet/),
    ).toBeInTheDocument()
  })

  it("shows None yet when no liked tastes", async () => {
    render(
      <InsightsPage
        client={mockClient({
          get: vi.fn().mockResolvedValue({
            ...ready,
            topLikedTastes: [],
            tips: [],
          }),
        })}
      />,
    )

    expect(await screen.findByText("Tastes liked most")).toBeInTheDocument()
    const tastes = screen.getByText("Tastes liked most").closest("div")
    expect(tastes?.querySelector("dd")).toHaveTextContent("None yet")
  })

  it("surfaces load errors", async () => {
    render(
      <InsightsPage
        client={mockClient({
          get: vi.fn().mockRejectedValue(new Error("Not signed in")),
        })}
      />,
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in")
  })
})
