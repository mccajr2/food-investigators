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
import { BRAND_NAME } from "@/components/BrandLogo"

const sampleSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "planned",
  foods: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      name: "Apples",
      iconKey: "apple",
      familiarity: "safe",
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
    updateParentNote: vi.fn(),
    ...overrides,
  } as SessionsClient
}

async function skipOptionalStepsAfterLiked(
  user: ReturnType<typeof userEvent.setup>,
) {
  for (let step = 0; step < 6; step += 1) {
    await user.click(screen.getByRole("button", { name: "Skip" }))
  }
}

async function skipAllOptionalSteps(user: ReturnType<typeof userEvent.setup>) {
  for (let step = 0; step < 7; step += 1) {
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
      tastes: null,
      whyNote: null,
      changeNote: null,
      ateEnough: true,
    })
    expect(request.foods[1].whyNote).toBeNull()
    expect(request.foods[1].changeNote).toBe("less sugar")
    expect(request.foods[1].ateEnough).toBe(false)
  })

  it("includes selected tastes and collapses duplicates", () => {
    const request = buildCompleteRequest([
      {
        position: 1,
        tastes: ["sweet", "salty", "sweet"],
        ateEnough: true,
      },
      {
        position: 2,
        tastes: [],
        ateEnough: true,
      },
    ])

    expect(request.foods[0].tastes).toEqual(["sweet", "salty"])
    expect(request.foods[1].tastes).toBeNull()
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
    expect(screen.getByRole("img", { name: BRAND_NAME })).toHaveAttribute(
      "data-brand-logo",
      "compact",
    )
  })

  it("captures multi-select tastes with example icons then continues", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        liked: "like",
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
    await user.click(screen.getByRole("option", { name: "Soft" }))

    expect(screen.getByText("How did it taste?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sweet" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bitter" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Bitter" }).querySelectorAll("svg")
        .length,
    ).toBe(3)

    await user.click(screen.getByRole("button", { name: "Sweet" }))
    await user.click(screen.getByRole("button", { name: "Salty" }))
    expect(screen.getByRole("button", { name: "Sweet" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Sweet" }).className).toContain(
      "run-placemat--selected",
    )
    expect(screen.getByRole("button", { name: "Bitter" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
    expect(screen.getByRole("button", { name: "Bitter" }).className).not.toContain(
      "run-placemat--selected",
    )
    await user.click(screen.getByRole("button", { name: "Done" }))

    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole("button", { name: "Skip" }))
    }
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        sampleSession.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              position: 1,
              tastes: ["sweet", "salty"],
            }),
            expect.objectContaining({
              position: 2,
              tastes: null,
            }),
          ],
        }),
      )
    })
  })

  it("walks both foods and completes the session", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        liked: index === 0 ? "like" : null,
        // Stretch food (Strawberries) ate enough — safe alone does not unlock.
        ateEnough: index === 1,
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
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(screen.getByText("Food 2 of 2")).toBeInTheDocument()
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(sampleSession.id, {
        foods: [
          expect.objectContaining({
            position: 1,
            liked: "like",
            ateEnough: false,
          }),
          expect.objectContaining({
            position: 2,
            liked: null,
            ateEnough: true,
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
      await screen.findByLabelText("Catch game: Strawberries"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Strawberries/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onComplete).not.toHaveBeenCalled()
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows food pick then game pick then Catch when both stretch foods ate enough", async () => {
    const user = userEvent.setup()
    const twoStretch = {
      ...sampleSession,
      foods: sampleSession.foods.map((food) =>
        food.familiarity === "safe"
          ? { ...food, familiarity: "familiar" as const }
          : food,
      ),
    }
    const completed: SessionResponse = {
      ...twoStretch,
      status: "completed",
      foods: twoStretch.foods.map((food) => ({
        ...food,
        ateEnough: true,
      })),
    }
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={twoStretch}
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
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("starts Cross from game pick when one stretch food ate enough", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 1,
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
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cross" }))
    expect(
      await screen.findByLabelText("Cross game: Strawberries"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Strawberries/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows parent notes after Match finishes", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 1,
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
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Match" }))
    expect(
      await screen.findByLabelText("Match game: Strawberries"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
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
        ateEnough: index === 1,
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
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Surprise" }))
    expect(await screen.findByLabelText("Surprise reveal")).toBeInTheDocument()
    expect(screen.getByText("Surprise: Catch!")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Let's go" }))
    expect(
      await screen.findByLabelText("Catch game: Strawberries"),
    ).toBeInTheDocument()

    randomSpy.mockRestore()
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
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
    expect(onComplete).not.toHaveBeenCalled()
    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("shows habit encouragement when only a safe food ate enough", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 0,
      })),
    }

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(await screen.findByLabelText("Encouragement")).toBeInTheDocument()
    expect(screen.getByText("Nice night")).toBeInTheDocument()
    expect(
      screen.getByText(/showing up for tasting keeps the habit going/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/game/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Pick game")).not.toBeInTheDocument()
  })

  it("saves parent notes after reward before returning to Plan", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 1,
      })),
    }
    const withNote: SessionResponse = {
      ...completed,
      parentNote: "Tired after school",
    }
    const updateParentNote = vi.fn().mockResolvedValue(withNote)
    const onComplete = vi.fn()

    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
          updateParentNote,
        })}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    )

    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipAllOptionalSteps(user)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Catch" }))
    await user.click(await screen.findByRole("button", { name: "Done" }))

    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.type(
      screen.getByRole("textbox", { name: "Optional parent note" }),
      "Tired after school",
    )
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(updateParentNote).toHaveBeenCalledWith(completed.id, {
        parentNote: "Tired after school",
      })
    })
    expect(onComplete).toHaveBeenCalledWith(withNote)
  })

  it("supports typing mic answers when speech is unavailable", async () => {
    const user = userEvent.setup()
    const twoStretch = {
      ...sampleSession,
      foods: sampleSession.foods.map((food) =>
        food.familiarity === "safe"
          ? { ...food, familiarity: "familiar" as const }
          : food,
      ),
    }
    const complete = vi.fn().mockResolvedValue({
      ...twoStretch,
      status: "completed",
      foods: twoStretch.foods.map((food) => ({
        ...food,
        ateEnough: true,
      })),
    })

    render(
      <RunSessionPage
        session={twoStretch}
        sessionsClient={mockSessionsClient({ complete })}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("option", { name: "Like" }))
    // Skip texture, tastes, temperature, smell → why note
    await user.click(screen.getByRole("button", { name: "Skip" }))
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
