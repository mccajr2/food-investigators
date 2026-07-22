import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import {
  advanceHazards,
  CrossGame,
  CROSS_COLS,
  GOAL_LANE,
  HAZARD_KINDS,
  initialCrossBoard,
  movePlayer,
  patternHasStartColumnStatic,
  playerHitObstacle,
  spawnHazard,
  startColumn,
  STATIC_PATTERNS,
  staticsForPattern,
} from "@/components/run/CrossGame"
import * as rewardBestScores from "@/components/run/rewardBestScores"
import {
  RUN_GAME_CELEBRATE,
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"

const crossAudioApi = vi.hoisted(() => ({
  resume: vi.fn().mockResolvedValue(undefined),
  playJump: vi.fn(),
  playOuch: vi.fn(),
  playCrossing: vi.fn(),
  playNewBest: vi.fn(),
  startBed: vi.fn(),
  stop: vi.fn(),
}))

vi.mock("@/components/run/crossAudio", () => ({
  createCrossAudio: () => crossAudioApi,
}))

const food: SessionFoodResponse = {
  foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  familiarity: "likes",
  variantNote: "Honeycrisp",
  position: 1,
  ateEnough: true,
}

/** Path around pattern 0 start-column gate (static at lane 2, col 2). */
async function crossAroundPattern0(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole("button", { name: "Move up" }))
  await user.click(screen.getByRole("button", { name: "Move left" }))
  await user.click(screen.getByRole("button", { name: "Move up" }))
  await user.click(screen.getByRole("button", { name: "Move up" }))
  await user.click(screen.getByRole("button", { name: "Move up" }))
  await user.click(screen.getByRole("button", { name: "Move right" }))
  await user.click(screen.getByRole("button", { name: "Move up" }))
}

describe("cross board helpers", () => {
  it("every static pattern blocks the start column on a traffic lane", () => {
    expect(HAZARD_KINDS).toHaveLength(3)
    for (let index = 0; index < STATIC_PATTERNS.length; index += 1) {
      const statics = staticsForPattern(index)
      expect(patternHasStartColumnStatic(statics)).toBe(true)
    }
  })

  it("movePlayer reaches the goal, counts a crossing, and advances the pattern", () => {
    let board = {
      ...initialCrossBoard(),
      // Clear start-col gate so a straight path works in the helper test.
      statics: [{ lane: 2, col: 0 }],
      patternIndex: 0,
    }
    for (let step = 0; step < GOAL_LANE; step += 1) {
      board = movePlayer(board, "up")
    }
    expect(board.crossings).toBe(1)
    expect(board.playerLane).toBe(0)
    expect(board.playerCol).toBe(startColumn())
    expect(board.patternIndex).toBe(1)
    expect(board.statics).toEqual(staticsForPattern(1))
    expect(board.hazards).toHaveLength(0)
    expect(patternHasStartColumnStatic(board.statics)).toBe(true)
  })

  it("resets the player when a hazard lands on them (Strict Mode safe)", () => {
    const board = {
      ...initialCrossBoard(),
      playerLane: 2,
      playerCol: 2,
      statics: [],
      hazards: [
        {
          id: 1,
          lane: 2,
          col: 1,
          dir: 1 as const,
          kind: "block" as const,
        },
      ],
    }
    const first = advanceHazards(board)
    expect(first.playerLane).toBe(0)
    expect(first.playerCol).toBe(Math.floor(CROSS_COLS / 2))

    const second = advanceHazards(board)
    expect(second.playerLane).toBe(0)
  })

  it("spawnHazard bumps the player home when it lands on them", () => {
    const board = {
      ...initialCrossBoard(),
      playerLane: 1,
      playerCol: 0,
      statics: [],
    }
    // random() === 0 → lane 1, dir +1, col 0, kind block
    const next = spawnHazard(board, 7, () => 0)
    expect(next.hazards).toHaveLength(1)
    expect(next.hazards[0]?.kind).toBe("block")
    expect(next.playerLane).toBe(0)
    expect(next.playerCol).toBe(Math.floor(CROSS_COLS / 2))
  })

  it("detects walking onto a static obstacle", () => {
    const board = {
      ...initialCrossBoard(),
      statics: [{ lane: 1, col: startColumn() }],
    }
    const moved = movePlayer(board, "up")
    expect(moved.playerLane).toBe(1)
    expect(playerHitObstacle(moved)).toBe(true)
  })
})

describe("CrossGame", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it("shows food theme, static gate, and large move controls while playing", async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<CrossGame food={food} onDone={onDone} roundMs={30_000} />)

    expect(screen.getByLabelText("Cross game: Apples")).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples \(Honeycrisp\)/)).toBeInTheDocument()
    expect(screen.getByLabelText("Cross play area")).toBeInTheDocument()
    expect(screen.getByLabelText("Cross play area").className).toContain(
      "run-play-frame",
    )
    expect(screen.getByTestId("cross-player")).toBeInTheDocument()
    expect(screen.getAllByTestId("cross-static").length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByTestId("cross-static")
        .some(
          (node) =>
            node.getAttribute("data-col") === String(startColumn()) &&
            Number(node.getAttribute("data-lane")) > 0,
        ),
    ).toBe(true)
    expect(screen.getByRole("heading", { name: "Cross" }).className).toBe(
      RUN_GAME_TITLE,
    )
    expect(screen.getByText(/Crossings:/).parentElement?.className).toBe(
      RUN_GAME_HUD,
    )
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()

    expect(screen.getByLabelText("Move controls")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Move up" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Move left" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Move down" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Move right" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Move up" }))
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onDone).toHaveBeenCalled()
  })

  it("shows a short Crossed! banner after reaching the goal", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    })
    render(<CrossGame food={food} onDone={vi.fn()} roundMs={30_000} />)

    await crossAroundPattern0(user)

    const banner = await screen.findByText("Crossed!")
    expect(banner).toBeInTheDocument()
    expect(banner.className).toContain(RUN_GAME_CELEBRATE)
    expect(screen.getByLabelText("Cross play area").className).toContain(
      "cross-celebrate",
    )
  })

  it("ends the round and shows Best on the finish screen", async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<CrossGame food={food} onDone={onDone} roundMs={200} />)

    expect(screen.getByLabelText("Cross play area")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByLabelText("Cross finished")).toBeInTheDocument()
    const finishTitle = screen.getByText(/Nice crossing/)
    expect(finishTitle.className).toBe(RUN_GAME_FINISH_TITLE)
    expect(screen.getByText(/Best:/)).toBeInTheDocument()
    expect(screen.queryByText("New best!")).not.toBeInTheDocument()
    expect(crossAudioApi.playCrossing).toHaveBeenCalled()
    expect(crossAudioApi.playNewBest).not.toHaveBeenCalled()

    screen.getByRole("button", { name: "Done" }).click()
    expect(onDone).toHaveBeenCalled()
  })

  it("shows New best! when recordScore reports a new best", async () => {
    vi.useFakeTimers()
    vi.spyOn(rewardBestScores, "recordScore").mockReturnValue({
      best: 3,
      isNewBest: true,
    })
    render(
      <CrossGame
        food={food}
        onDone={vi.fn()}
        roundMs={200}
        householdId="hh-cross"
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText("New best!")).toBeInTheDocument()
    expect(screen.getByText("Best: 3")).toBeInTheDocument()
    expect(rewardBestScores.recordScore).toHaveBeenCalledWith(
      "cross",
      expect.any(Number),
      "hh-cross",
    )
    expect(crossAudioApi.playNewBest).toHaveBeenCalled()
    expect(crossAudioApi.playCrossing).not.toHaveBeenCalled()
  })
})
