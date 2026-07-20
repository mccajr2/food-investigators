import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { SessionsClient } from "@/api"
import type { SessionResponse } from "@/api/types"
import {
  buildCompleteRequest,
  RunSessionPage,
} from "@/components/run/RunSessionPage"

const sampleSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "planned",
  foods: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      name: "Apples",
      iconKey: "apple",
      familiarity: "likes",
      variantNote: "Honeycrisp",
      position: 1,
    },
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
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
    listUpcoming: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    ...overrides,
  } as SessionsClient
}

async function skipOptionalStepsAfterLiked(
  user: ReturnType<typeof userEvent.setup>,
) {
  for (let step = 0; step < 5; step += 1) {
    await user.click(screen.getByRole("button", { name: "Skip" }))
  }
}

async function skipAllOptionalSteps(user: ReturnType<typeof userEvent.setup>) {
  for (let step = 0; step < 6; step += 1) {
    await user.click(screen.getByRole("button", { name: "Skip" }))
  }
}

describe("buildCompleteRequest", () => {
  it("maps skipped fields to null and requires ateEnough", () => {
    const request = buildCompleteRequest([
      {
        position: 1,
        liked: "like",
        texture: null,
        ateEnough: true,
      },
      {
        position: 2,
        liked: null,
        whyNote: "  ",
        changeNote: "less sugar",
        ateEnough: false,
      },
    ])

    expect(request.foods[0]).toEqual({
      position: 1,
      liked: "like",
      texture: null,
      temperature: null,
      smell: null,
      whyNote: null,
      changeNote: null,
      ateEnough: true,
    })
    expect(request.foods[1].whyNote).toBeNull()
    expect(request.foods[1].changeNote).toBe("less sugar")
    expect(request.foods[1].ateEnough).toBe(false)
  })
})

describe("RunSessionPage", () => {
  it("walks both foods and completes the session", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        liked: index === 0 ? "like" : null,
        ateEnough: index === 0,
      })),
    }
    const complete = vi.fn().mockResolvedValue(completed)
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({ complete })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("dialog", { name: "Run tasting session" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Did you like it?")).toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: "Like" }))
    await skipOptionalStepsAfterLiked(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(screen.getByText("Food 2 of 2")).toBeInTheDocument()
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(sampleSession.id, {
        foods: [
          expect.objectContaining({
            position: 1,
            liked: "like",
            ateEnough: true,
          }),
          expect.objectContaining({
            position: 2,
            liked: null,
            ateEnough: false,
          }),
        ],
      })
    })
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("supports typing mic answers when speech is unavailable", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
    })

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({ complete })}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("option", { name: "Like" }))
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("button", { name: "Skip" }))

    await user.type(screen.getByLabelText("Answer"), "crunchy")
    await user.click(screen.getByRole("button", { name: "Use this" }))
    await user.type(screen.getByLabelText("Answer"), "less peel")
    await user.click(screen.getByRole("button", { name: "Use this" }))
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        sampleSession.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              whyNote: "crunchy",
              changeNote: "less peel",
            }),
            expect.anything(),
          ],
        }),
      )
    })
  })

  it("exits when Exit is pressed", async () => {
    const user = userEvent.setup()
    const onExit = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={onExit}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Exit" }))
    expect(onExit).toHaveBeenCalled()
  })
})
