import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { SessionsClient } from "@/api"
import type { SessionResponse } from "@/api/types"
import {
  areRunOutcomesDirty,
  buildCompleteRequest,
  previousRunPosition,
  runStepsForFamiliarity,
  RunSessionPage,
} from "@/components/run/RunSessionPage"
import { RUN_THEME } from "@/components/run/runTheme"
import { BRAND_NAME } from "@/components/BrandLogo"
import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"

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

type User = ReturnType<typeof userEvent.setup>

/** From liked: skip optional steps through why (+ stretch texture/tastes). Leaves ateEnough. */
async function skipToAteEnough(user: User, stretch: boolean) {
  await user.click(screen.getByRole("button", { name: "Skip" })) // liked
  await user.click(screen.getByRole("button", { name: "Skip" })) // why
  if (stretch) {
    await user.click(screen.getByRole("button", { name: "Skip" })) // texture
    await user.click(screen.getByRole("button", { name: "Skip" })) // tastes
  }
}

/** Liked choice → why is next immediately. */
async function advanceToWhyStep(
  user: User,
  likedLabel: "Like" | "So-so" | "No",
) {
  await user.click(screen.getByRole("option", { name: likedLabel }))
}

describe("areRunOutcomesDirty", () => {
  it("is clean for initial drafts and dirty once any field is set", () => {
    const clean = [
      { position: 1 as const },
      { position: 2 as const },
    ] as const
    expect(areRunOutcomesDirty(clean)).toBe(false)
    expect(
      areRunOutcomesDirty([
        { position: 1, liked: null },
        { position: 2 },
      ]),
    ).toBe(true)
    expect(
      areRunOutcomesDirty([
        { position: 1 },
        { position: 2, ateEnough: false },
      ]),
    ).toBe(true)
  })
})

describe("runStepsForFamiliarity", () => {
  it("uses short path for safe and stretch path otherwise", () => {
    expect(runStepsForFamiliarity("safe")).toEqual([
      "liked",
      "why",
      "ateEnough",
    ])
    expect(runStepsForFamiliarity("familiar_but_new")).toEqual([
      "liked",
      "why",
      "texture",
      "tastes",
      "ateEnough",
    ])
    expect(runStepsForFamiliarity("truly_new")).toEqual([
      "liked",
      "why",
      "texture",
      "tastes",
      "ateEnough",
    ])
    expect(runStepsForFamiliarity("retrying")).toEqual([
      "liked",
      "why",
      "texture",
      "tastes",
      "ateEnough",
    ])
  })
})

describe("buildCompleteRequest", () => {
  it("maps skipped fields to null, forces demoted fields null, requires ateEnough", () => {
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
    expect(request.foods[1].changeNote).toBeNull()
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
  it("uses short steps for safe and stretch steps for non-safe foods", async () => {
    const user = userEvent.setup()
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    // Safe food 1: liked → why → ateEnough (no texture)
    await user.click(screen.getByRole("option", { name: "Like" }))
    expect(screen.getByText("Why did you like it?")).toBeInTheDocument()
    expect(screen.queryByText("What was the texture?")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(screen.getByText("Did they eat enough?")).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "No" }))

    // Stretch food 2: liked → why → texture → tastes → ateEnough
    await user.click(screen.getByRole("option", { name: "Like" }))
    expect(screen.getByText("Why did you like it?")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(screen.getByText("What was the texture?")).toBeInTheDocument()
    expect(
      screen.queryByText("What was the temperature?"),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("How did it smell?")).not.toBeInTheDocument()
    expect(
      screen.queryByText("Is there something we could change next time?"),
    ).not.toBeInTheDocument()
  })

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
    const stretchFirst: SessionResponse = {
      ...sampleSession,
      foods: [
        { ...sampleSession.foods[1], position: 1 },
        { ...sampleSession.foods[0], position: 2 },
      ],
    }
    const complete = vi.fn().mockResolvedValue({
      ...stretchFirst,
      status: "completed",
      foods: stretchFirst.foods.map((food) => ({
        ...food,
        liked: "like",
        ateEnough: true,
      })),
    })

    render(
      <RunSessionPage
        session={stretchFirst}
        sessionsClient={mockSessionsClient({ complete })}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("option", { name: "Like" }))
    await user.click(screen.getByRole("button", { name: "Skip" })) // why
    await user.click(screen.getByRole("option", { name: "Soft" }))

    expect(screen.getByText("How did it taste?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sweet" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bitter" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Bitter" }).querySelectorAll("img")
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
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.click(screen.getByRole("option", { name: "Yes" }))

    // Food 2 safe: skip to ateEnough
    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        stretchFirst.id,
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

  it("shows like why chips and gates Continue until chip or note", async () => {
    const user = userEvent.setup()
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await advanceToWhyStep(user, "Like")

    expect(screen.getByLabelText("Why note")).toBeInTheDocument()
    expect(screen.getByText("Why did you like it?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "tasty" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "tasty" })).toHaveTextContent(
      "tasty",
    )
    expect(
      screen.getByRole("button", { name: "tasty" }).querySelector("img"),
    ).not.toBeNull()
    expect(screen.getByRole("button", { name: "crunchy" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "yucky taste" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "tasty" }))
    expect(screen.getByRole("button", { name: "tasty" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(
      screen.getByRole("button", { name: "tasty" }).querySelector("img"),
    ).not.toBeNull()
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
  })

  it("shows dislike why chips for No", async () => {
    const user = userEvent.setup()
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await advanceToWhyStep(user, "No")

    expect(screen.getByText("Why didn't you like it?")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "yucky taste" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "tasty" })).not.toBeInTheDocument()
  })

  it.each([
    {
      liked: "Like" as const,
      chips: WHY_CHIPS_BY_LIKED.like,
      absent: "yucky taste",
    },
    {
      liked: "No" as const,
      chips: WHY_CHIPS_BY_LIKED.no,
      absent: "tasty",
    },
    {
      liked: "So-so" as const,
      chips: WHY_CHIPS_BY_LIKED.so_so,
      // temperature + middling stay off the mixed so-so board
      absent: "warm",
    },
  ])(
    "shows icon + visible text label for every $liked why chip",
    async ({ liked, chips, absent }) => {
      const user = userEvent.setup()
      render(
        <RunSessionPage
          session={sampleSession}
          sessionsClient={mockSessionsClient()}
          onComplete={vi.fn()}
          onExit={vi.fn()}
        />,
      )
      await advanceToWhyStep(user, liked)

      for (const chip of chips) {
        const button = screen.getByRole("button", { name: chip })
        expect(button).toHaveTextContent(chip)
        expect(button.querySelector("span")).toHaveTextContent(chip)
        expect(button.querySelector("svg")).toBeNull()
        const img = button.querySelector("img")
        expect(img).not.toBeNull()
        expect(img?.getAttribute("data-why-chip")).toBe(chip)
        expect(img?.getAttribute("data-why-chip-src")).toBe("static")
      }
      expect(
        screen.queryByRole("button", { name: absent }),
      ).not.toBeInTheDocument()
    },
  )

  it("shows mixed good/bad so-so chips and persists mix in chip order", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: false,
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

    await advanceToWhyStep(user, "So-so")

    expect(screen.getByText("Why was it so-so?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "yummy smell" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "too crunchy" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "kind of tasty" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "not sure" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "too crunchy" }))
    await user.click(screen.getByRole("button", { name: "yummy smell" }))
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.click(screen.getByRole("option", { name: "No" }))

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        sampleSession.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              position: 1,
              liked: "so_so",
              whyNote: "yummy smell, too crunchy",
            }),
            expect.objectContaining({
              position: 2,
              whyNote: null,
            }),
          ],
        }),
      )
    })
  })

  it("persists chips and optional note into whyNote on complete", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: false,
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

    await advanceToWhyStep(user, "Like")
    await user.click(screen.getByRole("button", { name: "crunchy" }))
    await user.click(screen.getByRole("button", { name: "tasty" }))
    await user.type(screen.getByLabelText("Answer"), "liked the peel")
    await user.click(screen.getByRole("button", { name: "Continue" }))
    // Safe food: ateEnough next
    await user.click(screen.getByRole("option", { name: "No" }))

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        sampleSession.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              position: 1,
              liked: "like",
              whyNote: "tasty, crunchy — liked the peel",
            }),
            expect.objectContaining({
              position: 2,
              whyNote: null,
            }),
          ],
        }),
      )
    })
  })

  it("stores null whyNote when why is skipped", async () => {
    const user = userEvent.setup()
    const complete = vi.fn().mockResolvedValue({
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food) => ({
        ...food,
        ateEnough: false,
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

    await advanceToWhyStep(user, "Like")
    await user.click(screen.getByRole("button", { name: "Skip" })) // why
    await user.click(screen.getByRole("option", { name: "No" }))

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "No" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        sampleSession.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              position: 1,
              whyNote: null,
            }),
            expect.anything(),
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
    await user.click(screen.getByRole("button", { name: "Skip" })) // why (safe)
    await user.click(screen.getByRole("option", { name: "No" }))

    expect(screen.getByText("Food 2 of 2")).toBeInTheDocument()
    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(sampleSession.id, {
        foods: [
          expect.objectContaining({
            position: 1,
            liked: "like",
            ateEnough: false,
            texture: null,
            tastes: null,
            temperature: null,
            smell: null,
            changeNote: null,
          }),
          expect.objectContaining({
            position: 2,
            liked: null,
            ateEnough: true,
            temperature: null,
            smell: null,
            changeNote: null,
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
          ? { ...food, familiarity: "familiar_but_new" as const }
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

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipToAteEnough(user, true)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipToAteEnough(user, true)
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
      parentNote:
        "Notes: Tired after school\n\nChange next time: smaller piece",
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Catch" }))
    await user.click(await screen.findByRole("button", { name: "Done" }))

    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.type(
      screen.getByRole("textbox", { name: "Session notes" }),
      "Tired after school",
    )
    await user.type(
      screen.getByRole("textbox", { name: "Change next time" }),
      "smaller piece",
    )
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(updateParentNote).toHaveBeenCalledWith(completed.id, {
        parentNote:
          "Notes: Tired after school\n\nChange next time: smaller piece",
      })
    })
    expect(onComplete).toHaveBeenCalledWith(withNote)
  })

  it("saves null parentNote when both parent fields are empty", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 1,
      })),
    }
    const updateParentNote = vi.fn().mockResolvedValue(completed)
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

    await skipToAteEnough(user, false)
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await user.click(await screen.findByRole("button", { name: "Catch" }))
    await user.click(await screen.findByRole("button", { name: "Done" }))

    expect(await screen.findByLabelText("Parent notes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(updateParentNote).toHaveBeenCalledWith(completed.id, {
        parentNote: null,
      })
    })
    expect(onComplete).toHaveBeenCalledWith(completed)
  })

  it("supports typing mic answers when speech is unavailable", async () => {
    const user = userEvent.setup()
    const twoStretch = {
      ...sampleSession,
      foods: sampleSession.foods.map((food) =>
        food.familiarity === "safe"
          ? { ...food, familiarity: "familiar_but_new" as const }
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
    await user.type(screen.getByLabelText("Answer"), "crunchy")
    await user.click(screen.getByRole("button", { name: "Continue" }))
    // Stretch: skip texture + tastes
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    await waitFor(() => {
      expect(complete).toHaveBeenCalledWith(
        twoStretch.id,
        expect.objectContaining({
          foods: [
            expect.objectContaining({
              whyNote: "crunchy",
              changeNote: null,
              temperature: null,
              smell: null,
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
    expect(screen.queryByTestId("run exit confirm")).toBeNull()
  })

  it("confirms before Exit when an outcome was answered, cancel keeps the run", async () => {
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

    await user.click(screen.getByRole("option", { name: "Like" }))
    expect(screen.getByText(/Why did you like it/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Exit" }))
    expect(onExit).not.toHaveBeenCalled()
    const confirm = screen.getByRole("dialog", { name: "Leave this night?" })
    expect(confirm).toHaveTextContent(/discards/i)

    await user.click(
      within(confirm).getByRole("button", { name: "Keep going" }),
    )
    expect(onExit).not.toHaveBeenCalled()
    expect(screen.queryByTestId("run exit confirm")).toBeNull()
    expect(screen.getByText(/Why did you like it/)).toBeInTheDocument()
  })

  it("discards and exits after confirming a dirty Exit", async () => {
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

    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("button", { name: "Exit" }))

    const confirm = screen.getByRole("dialog", { name: "Leave this night?" })
    await user.click(
      within(confirm).getByRole("button", { name: "Leave and discard" }),
    )
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it("disables Back on the first step and goes back after advancing", async () => {
    const user = userEvent.setup()
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    const back = screen.getByRole("button", { name: "Back" })
    expect(back).toBeDisabled()
    expect(screen.getByText("Did you like it?")).toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: "Like" }))
    expect(screen.getByLabelText("Why note")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByText("Did you like it?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
  })

  it("goes Back from which-game to food pick when multiple rewards", async () => {
    const user = userEvent.setup()
    const twoStretch: SessionResponse = {
      ...sampleSession,
      foods: [
        {
          ...sampleSession.foods[0],
          familiarity: "truly_new",
          name: "Broccoli",
          iconKey: "broccoli",
          variantNote: null,
        },
        {
          ...sampleSession.foods[1],
          familiarity: "familiar_but_new",
        },
      ],
    }
    const completed: SessionResponse = {
      ...twoStretch,
      status: "completed",
      foods: twoStretch.foods.map((food) => ({
        ...food,
        liked: "like",
        ateEnough: true,
      })),
    }
    render(
      <RunSessionPage
        session={twoStretch}
        sessionsClient={mockSessionsClient({
          complete: vi.fn().mockResolvedValue(completed),
        })}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))
    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick food for game")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Broccoli" }))
    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(await screen.findByLabelText("Pick food for game")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
  })

  it("restores why chips when going Back to the why step", async () => {
    const user = userEvent.setup()
    render(
      <RunSessionPage
        session={sampleSession}
        sessionsClient={mockSessionsClient()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await advanceToWhyStep(user, "Like")
    await user.click(screen.getByRole("button", { name: "tasty" }))
    await user.click(screen.getByRole("button", { name: "Continue" }))
    expect(screen.getByText("Did they eat enough?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("Why note")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "tasty" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  it("disables Back during Catch play", async () => {
    const user = userEvent.setup()
    const completed: SessionResponse = {
      ...sampleSession,
      status: "completed",
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        ateEnough: index === 1,
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

    await user.click(screen.getByRole("option", { name: "Like" }))
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await user.click(screen.getByRole("option", { name: "No" }))
    await skipToAteEnough(user, true)
    await user.click(screen.getByRole("option", { name: "Yes" }))

    expect(await screen.findByLabelText("Pick game")).toBeInTheDocument()
    // Single eligible stretch → which-game is first reward screen
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Catch" }))
    expect(
      await screen.findByLabelText("Catch game: Strawberries"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
  })

  it("previousRunPosition walks stretch steps and prior food", () => {
    const fam = (index: number) =>
      index === 0 ? ("safe" as const) : ("truly_new" as const)
    expect(previousRunPosition(0, 0, fam)).toBeNull()
    expect(previousRunPosition(0, 1, fam)).toEqual({ foodIndex: 0, stepIndex: 0 })
    expect(previousRunPosition(1, 0, fam)).toEqual({
      foodIndex: 0,
      stepIndex: runStepsForFamiliarity("safe").length - 1,
    })
    expect(previousRunPosition(1, 2, fam)).toEqual({ foodIndex: 1, stepIndex: 1 })
  })
})
