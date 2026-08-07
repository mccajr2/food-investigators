import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import {
  CatchGame,
  CATCHER_WIDTH,
  PIECE_SIZE,
  advanceBoard,
} from "@/components/run/CatchGame"
import * as rewardBestScores from "@/components/run/rewardBestScores"
import {
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"

const catchAudioApi = vi.hoisted(() => ({
  resume: vi.fn().mockResolvedValue(undefined),
  playCatch: vi.fn(),
  playCheer: vi.fn(),
  playNewBest: vi.fn(),
  startBed: vi.fn(),
  stop: vi.fn(),
}))

vi.mock("@/components/run/catchAudio", () => ({
  createCatchAudio: () => catchAudioApi,
}))

const food: SessionFoodResponse = {
  foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  familiarity: "safe",
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


function mockPointerCoarse(coarse: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(pointer: coarse)" ? coarse : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("CatchGame", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows food theme and large basket controls while playing", async () => {
    mockPointerCoarse(false)
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<CatchGame food={food} onDone={onDone} roundMs={30_000} />)

    expect(screen.getByLabelText("Catch game: Apples")).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples \(Honeycrisp\)/)).toBeInTheDocument()
    expect(screen.getByText("Drag to move the basket")).toBeInTheDocument()
    expect(screen.getByLabelText("Catch play area")).toBeInTheDocument()
    expect(screen.getByLabelText("Catch play area").className).toContain(
      "run-play-frame",
    )
    expect(screen.getByTestId("catcher").className).toContain("run-basket")
    expect(screen.getByTestId("catcher").querySelector(".run-basket-bowl")).toBeTruthy()
    expect(screen.getByTestId("catcher").querySelector(".run-basket-rim")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Catch" }).className).toBe(
      RUN_GAME_TITLE,
    )
    expect(screen.getByText(/Caught:/).parentElement?.className).toBe(
      RUN_GAME_HUD,
    )
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Move basket right" }))
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onDone).toHaveBeenCalled()
  })

  it("moves the basket with pointer drag on the play area", () => {
    mockPointerCoarse(false)
    const onDone = vi.fn()
    render(<CatchGame food={food} onDone={onDone} roundMs={30_000} />)

    const playArea = screen.getByLabelText("Catch play area")
    expect(playArea.className).toContain("touch-none")
    expect(playArea.style.touchAction).toBe("none")

    vi.spyOn(playArea, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 280,
      right: 400,
      width: 400,
      height: 280,
      toJSON: () => ({}),
    })
    const setPointerCapture = vi.fn()
    const releasePointerCapture = vi.fn()
    Object.assign(playArea, {
      setPointerCapture,
      releasePointerCapture,
      hasPointerCapture: () => true,
    })

    fireEvent.pointerDown(playArea, {
      pointerId: 1,
      clientX: 80,
      pointerType: "touch",
    })
    fireEvent.pointerMove(playArea, {
      pointerId: 1,
      clientX: 320,
      pointerType: "touch",
      buttons: 1,
    })

    // clientX 320 / 400 = 80% → basket left = 80 - CATCHER_WIDTH/2
    const expectedLeft = 80 - CATCHER_WIDTH / 2
    expect(screen.getByTestId("catcher").style.left).toBe(`${expectedLeft}%`)
    expect(setPointerCapture).toHaveBeenCalledWith(1)
  })

  it("hides Left/Right on coarse pointers and keeps the drag hint", () => {
    mockPointerCoarse(true)
    render(<CatchGame food={food} onDone={vi.fn()} roundMs={30_000} />)

    expect(screen.getByText("Drag to move the basket")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Move basket left" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Move basket right" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
  })

  it("ends the round and shows Best on the finish screen", async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<CatchGame food={food} onDone={onDone} roundMs={200} />)

    expect(screen.getByLabelText("Catch play area")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByLabelText("Catch finished")).toBeInTheDocument()
    expect(screen.queryByText("Drag to move the basket")).not.toBeInTheDocument()
    const finishTitle = screen.getByText(/Nice catching/)
    expect(finishTitle.className).toBe(RUN_GAME_FINISH_TITLE)
    expect(screen.getByText(/Best:/)).toBeInTheDocument()
    expect(screen.queryByText("New best!")).not.toBeInTheDocument()
    expect(catchAudioApi.playCheer).toHaveBeenCalled()
    expect(catchAudioApi.playNewBest).not.toHaveBeenCalled()

    screen.getByRole("button", { name: "Done" }).click()
    expect(onDone).toHaveBeenCalled()
  })

  it("shows New best! when recordScore reports a new best", async () => {
    vi.useFakeTimers()
    vi.spyOn(rewardBestScores, "recordScore").mockReturnValue({
      best: 5,
      isNewBest: true,
    })
    render(
      <CatchGame
        food={food}
        onDone={vi.fn()}
        roundMs={200}
        householdId="hh-test"
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText("New best!")).toBeInTheDocument()
    expect(screen.getByText("Best: 5")).toBeInTheDocument()
    expect(rewardBestScores.recordScore).toHaveBeenCalledWith(
      "catch",
      expect.any(Number),
      "hh-test",
    )
    expect(catchAudioApi.playNewBest).toHaveBeenCalled()
    expect(catchAudioApi.playCheer).not.toHaveBeenCalled()
  })
})
