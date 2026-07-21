import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import {
  advanceHazards,
  CrossGame,
  CROSS_COLS,
  GOAL_LANE,
  initialCrossBoard,
  movePlayer,
  spawnHazard,
} from "@/components/run/CrossGame"

const food: SessionFoodResponse = {
  foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  familiarity: "likes",
  variantNote: "Honeycrisp",
  position: 1,
  ateEnough: true,
}

describe("cross board helpers", () => {
  it("movePlayer reaches the goal and counts a crossing", () => {
    let board = initialCrossBoard()
    for (let step = 0; step < GOAL_LANE; step += 1) {
      board = movePlayer(board, "up")
    }
    expect(board.crossings).toBe(1)
    expect(board.playerLane).toBe(0)
    expect(board.playerCol).toBe(Math.floor(CROSS_COLS / 2))
  })

  it("resets the player when a hazard lands on them (Strict Mode safe)", () => {
    const board = {
      ...initialCrossBoard(),
      playerLane: 2,
      playerCol: 2,
      hazards: [{ id: 1, lane: 2, col: 1, dir: 1 as const }],
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
    }
    // random() === 0 → lane 1, dir +1, col 0 (same cell as player)
    const next = spawnHazard(board, 7, () => 0)
    expect(next.hazards).toHaveLength(1)
    expect(next.playerLane).toBe(0)
    expect(next.playerCol).toBe(Math.floor(CROSS_COLS / 2))
  })
})

describe("CrossGame", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows food theme and large move controls while playing", async () => {
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
    expect(screen.getByRole("heading", { name: "Cross" }).className).toContain(
      "run-prompt",
    )

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

    for (let step = 0; step < GOAL_LANE; step += 1) {
      await user.click(screen.getByRole("button", { name: "Move up" }))
    }

    expect(await screen.findByText("Crossed!")).toBeInTheDocument()
    expect(screen.getByLabelText("Cross play area").className).toContain(
      "cross-celebrate",
    )
  })

  it("ends the round and shows a Done finish screen", async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<CrossGame food={food} onDone={onDone} roundMs={200} />)

    expect(screen.getByLabelText("Cross play area")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByLabelText("Cross finished")).toBeInTheDocument()
    expect(screen.getByText(/Nice crossing/)).toBeInTheDocument()

    screen.getByRole("button", { name: "Done" }).click()
    expect(onDone).toHaveBeenCalled()
  })
})
