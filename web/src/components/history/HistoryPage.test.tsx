import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { SessionsClient } from "@/api"
import type { SessionResponse } from "@/api/types"
import { HistoryPage } from "@/components/history/HistoryPage"

const completedSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-21",
  status: "completed",
  foods: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      name: "Apples",
      iconKey: "apple",
      familiarity: "likes",
      variantNote: "Honeycrisp",
      position: 1,
      liked: "like",
      texture: "crunchy",
      temperature: "cold",
      smell: "like",
      whyNote: "crunchy",
      changeNote: "less peel",
      ateEnough: true,
    },
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "truly_new",
      variantNote: null,
      position: 2,
      liked: "no",
      texture: null,
      temperature: "warm",
      smell: null,
      whyNote: null,
      changeNote: null,
      ateEnough: false,
    },
  ],
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-21T00:00:00Z",
}

const olderSession: SessionResponse = {
  ...completedSession,
  id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  scheduledOn: "2026-07-10",
  foods: completedSession.foods.map((food) => ({
    ...food,
    variantNote: food.position === 1 ? "Older apple" : null,
  })),
  updatedAt: "2026-07-10T00:00:00Z",
}

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn(),
    listHistory: vi.fn().mockResolvedValue([]),
    downloadHistoryPdf: vi.fn().mockResolvedValue(new Blob(["%PDF"])),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    ...overrides,
  } as SessionsClient
}

describe("HistoryPage", () => {
  it("shows empty state when there is no history", async () => {
    render(<HistoryPage sessionsClient={mockSessionsClient()} />)

    expect(await screen.findByRole("heading", { name: "History" })).toBeInTheDocument()
    expect(
      screen.getByText(/No completed nights yet/),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument()
  })

  it("lists completed sessions and shows read-only detail", async () => {
    const user = userEvent.setup()
    render(
      <HistoryPage
        sessionsClient={mockSessionsClient({
          listHistory: vi.fn().mockResolvedValue([completedSession]),
        })}
      />,
    )

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument()
    expect(screen.getByText(/Select a night/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Save|Edit/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Honeycrisp/ }))

    const detail = screen.getByLabelText("Food 1: Apples")
    expect(within(detail).getAllByText("Like").length).toBe(2)
    expect(within(detail).getByText("Crunchy")).toBeInTheDocument()
    expect(within(detail).getByText("crunchy")).toBeInTheDocument()
    expect(within(detail).getByText("less peel")).toBeInTheDocument()
    expect(within(detail).getByText("Yes")).toBeInTheDocument()

    const food2 = screen.getByLabelText("Food 2: Strawberries")
    expect(within(food2).getAllByText("No").length).toBeGreaterThanOrEqual(1)
    expect(within(food2).getAllByText("Skipped").length).toBeGreaterThan(0)
    expect(within(food2).getByText("Warm")).toBeInTheDocument()

    expect(within(detail).queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("filters the list client-side and downloads PDF with the same range", async () => {
    const user = userEvent.setup()
    const downloadHistoryPdf = vi.fn().mockResolvedValue(new Blob(["%PDF-1.4"]))
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:history-pdf")
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})

    render(
      <HistoryPage
        sessionsClient={mockSessionsClient({
          listHistory: vi.fn().mockResolvedValue([completedSession, olderSession]),
          downloadHistoryPdf,
        })}
      />,
    )

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument()
    expect(screen.getByText(/Older apple/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-07-15" },
    })
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2026-07-31" },
    })

    expect(screen.getByText(/Honeycrisp/)).toBeInTheDocument()
    expect(screen.queryByText(/Older apple/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Download PDF" }))

    expect(downloadHistoryPdf).toHaveBeenCalledWith({
      from: "2026-07-15",
      to: "2026-07-31",
    })
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:history-pdf")

    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(screen.getByText(/Older apple/)).toBeInTheDocument()

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it("surfaces load errors", async () => {
    render(
      <HistoryPage
        sessionsClient={mockSessionsClient({
          listHistory: vi.fn().mockRejectedValue(new Error("Not signed in")),
        })}
      />,
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in")
  })
})
