import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import {
  advanceBoard,
  CatchGame,
  CATCHER_WIDTH,
  PIECE_SIZE,
} from "@/components/run/CatchGame"

const food: SessionFoodResponse = {
  foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  familiarity: "likes",
  variantNote: "Honeycrisp",
  position: 1,
  ateEnough: true,
}

describe("advanceBoard", () => {
  it("adds one point per caught piece even if applied twice (Strict Mode)", () => {
    const piece = {
      id: 1,
      x: 50 - PIECE_SIZE / 2,
      y: 84 - 2.2,
    }
    const catcherX = 50 - CATCHER_WIDTH / 2
    const first = advanceBoard({ pieces: [piece], score: 0 }, catcherX)
    expect(first.score).toBe(1)
    expect(first.pieces).toHaveLength(0)

    // Same prev + same inputs → same next (idempotent under double invoke).
    const second = advanceBoard({ pieces: [piece], score: 0 }, catcherX)
    expect(second.score).toBe(1)
  })
})

describe("CatchGame", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows food theme and large basket controls while playing", async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<CatchGame food={food} onDone={onDone} roundMs={30_000} />)

    expect(screen.getByLabelText("Catch game: Apples")).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples \(Honeycrisp\)/)).toBeInTheDocument()
    expect(screen.getByLabelText("Catch play area")).toBeInTheDocument()
    expect(screen.getByTestId("catcher")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Move basket right" }))
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onDone).toHaveBeenCalled()
  })

  it("ends the round and shows a Done finish screen", async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<CatchGame food={food} onDone={onDone} roundMs={200} />)

    expect(screen.getByLabelText("Catch play area")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByLabelText("Catch finished")).toBeInTheDocument()
    expect(screen.getByText(/Nice catching/)).toBeInTheDocument()

    screen.getByRole("button", { name: "Done" }).click()
    expect(onDone).toHaveBeenCalled()
  })
})
