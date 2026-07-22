import { act, render, screen } from "@testing-library/react"
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

    await act(async () => {
      vi.advanceTimersByTime(SURPRISE_REVEAL_MS)
    })

    expect(onChooseGame).toHaveBeenCalledWith({
      kind: "cross",
      food,
    })
  })
})
