import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { SessionsClient } from "@/api"
import type { SessionResponse } from "@/api/types"
import {
  buildCompleteRequest,
  RunSessionPage,
} from "@/components/run/RunSessionPage"
import { RUN_THEME } from "@/components/run/runTheme"

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
    listHistory: vi.fn(),
    downloadHistoryPdf: vi.fn(),
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
  it("exposes the scoped kitchen-run theme on the run root", () => {
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    const dialog = screen.getByRole("dialog", { name: "Run tasting session" })
    expect(dialog).toHaveAttribute("data-theme", RUN_THEME)
    expect(RUN_THEME).toBe("kitchen-run")
  })

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
    expect(
      screen.getByRole("dialog", { name: "Run tasting session" }),
    ).toHaveAttribute("data-theme", RUN_THEME)
    expect(screen.getByText("Did you like it?")).toBeInTheDocument()
    expect(
      screen.getByText("Did you like it?").closest(".run-enter"),
    ).not.toBeNull()
    expect(screen.getByRole("option", { name: "Like" }).className).toContain(
      "run-placemat",
    )

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
    expect(onComplete).not.toHaveBeenCalled()
    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Catch" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cross" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Surprise" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Catch" }))
    expect(
      await screen.findByLabelText("Catch game: Apples"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows food pick then game pick then Catch when both foods ate enough", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: true,
      })),
    }
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(
      await screen.findByLabelText("Pick food for game"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Which food for your game?").className,
    ).toContain("run-prompt")
    expect(screen.getByLabelText("Pick food for game").className).toContain(
      "run-enter",
    )
    expect(
      screen.getByRole("button", { name: /Strawberries/ }).className,
    ).toContain("run-placemat")
    await user.click(
      screen.getByRole("button", { name: /Strawberries/ }),
    )
    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    expect(screen.getByLabelText("Pick game").className).toContain("run-enter")
    await user.click(screen.getByRole("button", { name: "Catch" }))
    expect(
      await screen.findByLabelText("Catch game: Strawberries"),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Catch play area").className).toContain(
      "run-play-frame",
    )

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("starts Cross from game pick when one food ate enough", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 0,
      })),
    }
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cross" }))
    expect(
      await screen.findByLabelText("Cross game: Apples"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows Surprise reveal then starts the rolled game", async () => {
    const user = userEvent.setup()
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1)
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 0,
      })),
    }
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Surprise" }))
    expect(await screen.findByLabelText("Surprise reveal")).toBeInTheDocument()
    expect(screen.getByText("Surprise: Catch!")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Let's go" }))
    expect(
      await screen.findByLabelText("Catch game: Apples"),
    ).toBeInTheDocument()

    randomSpy.mockRestore()
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows encouragement when neither food ate enough", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: false,
      })),
    }
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(await screen.findByLabelText("Encouragement")).toBeInTheDocument()
    expect(screen.getByText(/try again another night/i)).toBeInTheDocument()
    expect(screen.getByText("Nice try tonight").className).toContain(
      "run-prompt",
    )
    expect(screen.queryByLabelText("Pick game")).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Catch game/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Cross game/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back to Plan" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("supports typing mic answers when speech is unavailable", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: true,
      })),
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
    expect(
      await screen.findByLabelText("Pick food for game"),
    ).toBeInTheDocument()
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
