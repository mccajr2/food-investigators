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
  familiarityLikes: 2,
  familiarityFamiliarButNew: 0,
  familiarityTrulyNew: 0,
  snackCount: 2,
  hasParentNotes: false,
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
  familiarityLikes: 4,
  familiarityFamiliarButNew: 2,
  familiarityTrulyNew: 0,
  snackCount: 1,
  hasParentNotes: true,
  tips: [
    {
      id: "mix_familiarity",
      message:
        "You've stuck to known foods — when you're ready, try one gentle familiar-but-new.",
    },
    {
      id: "keep_going",
      message: "You're building a tasting rhythm — keep going at a calm pace.",
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
    expect(screen.getByText("Crunchy, Soft")).toBeInTheDocument()
    expect(screen.getByText("Some nights have notes")).toBeInTheDocument()

    const tips = screen.getByRole("heading", { name: "Tips" }).closest("section")
    expect(tips).not.toBeNull()
    expect(within(tips!).getByText(/stuck to known foods/)).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: keep_going" }),
    )

    expect(dismissTip).toHaveBeenCalledWith("keep_going")
    await waitFor(() => {
      expect(
        screen.queryByText(/building a tasting rhythm/),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText(/stuck to known foods/)).toBeInTheDocument()
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
