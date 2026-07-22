import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import { RewardFlow } from "@/components/run/RewardFlow"
import { SURPRISE_REVEAL_MS } from "@/components/run/rewardFoods"
import { BRAND_NAME } from "@/components/BrandLogo"

const food: SessionFoodResponse = {
  foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
  name: "Apples",
  iconKey: "apple",
  familiarity: "likes",
  variantNote: null,
  position: 1,
  ateEnough: true,
}

describe("RewardFlow surprise reveal", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a fuller brand logo on encourage and which-game beats", () => {
    const { rerender } = render(
      <RewardFlow
        phase={{ kind: "encourage" }}
        onPick={vi.fn()}
        onChooseGame={vi.fn()}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByRole("img", { name: BRAND_NAME })).toHaveAttribute(
      "data-brand-logo",
      "full",
    )

    rerender(
      <RewardFlow
        phase={{ kind: "pickGame", food }}
        onPick={vi.fn()}
        onChooseGame={vi.fn()}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByRole("img", { name: BRAND_NAME })).toHaveAttribute(
      "data-brand-logo",
      "full",
    )
  })

  it("offers Catch, Cross, Match, and Surprise on which-game", () => {
    render(
      <RewardFlow
        phase={{ kind: "pickGame", food }}
        onPick={vi.fn()}
        onChooseGame={vi.fn()}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Catch" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cross" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Match" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Surprise" })).toBeInTheDocument()

    const pick = screen.getByLabelText("Pick game")
    expect(pick.querySelectorAll("[data-run-game-symbol]")).toHaveLength(4)
    expect(pick.textContent).not.toMatch(/[🧺🐸🃏✨]/u)
  })

  it("choosing Match advances to the match phase", async () => {
    const user = userEvent.setup()
    const onChooseGame = vi.fn()
    render(
      <RewardFlow
        phase={{ kind: "pickGame", food }}
        onPick={vi.fn()}
        onChooseGame={onChooseGame}
        onFinished={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Match" }))
    expect(onChooseGame).toHaveBeenCalledWith({ kind: "match", food })
  })

  it("renders Match when the phase is match", () => {
    render(
      <RewardFlow
        phase={{ kind: "match", food }}
        onPick={vi.fn()}
        onChooseGame={vi.fn()}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Match game: Apples")).toBeInTheDocument()
  })

  it("auto-advances from surprise reveal into the rolled game", async () => {
    vi.useFakeTimers()
    const onChooseGame = vi.fn()
    render(
      <RewardFlow
        phase={{ kind: "surpriseReveal", food, game: "cross" }}
        onPick={vi.fn()}
        onChooseGame={onChooseGame}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Surprise reveal")).toBeInTheDocument()
    expect(screen.getByText("Surprise: Cross!")).toBeInTheDocument()
    expect(
      screen
        .getByLabelText("Surprise reveal")
        .querySelector("[data-run-game-symbol]"),
    ).toBeTruthy()
    expect(screen.getByLabelText("Surprise reveal").textContent).not.toMatch(
      /[✨]/u,
    )

    await act(async () => {
      vi.advanceTimersByTime(SURPRISE_REVEAL_MS)
    })

    expect(onChooseGame).toHaveBeenCalledWith({
      kind: "cross",
      food,
    })
  })

  it("reveals Match when Surprise rolls Match", async () => {
    vi.useFakeTimers()
    const onChooseGame = vi.fn()
    render(
      <RewardFlow
        phase={{ kind: "surpriseReveal", food, game: "match" }}
        onPick={vi.fn()}
        onChooseGame={onChooseGame}
        onFinished={vi.fn()}
      />,
    )

    expect(screen.getByText("Surprise: Match!")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(SURPRISE_REVEAL_MS)
    })

    expect(onChooseGame).toHaveBeenCalledWith({
      kind: "match",
      food,
    })
  })
})
