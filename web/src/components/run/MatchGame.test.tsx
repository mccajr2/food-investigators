import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SessionFoodResponse } from "@/api/types"
import {
  dealMatchBoard,
  isBoardCleared,
  MatchGame,
  MATCH_CARD_COUNT,
  MATCH_PAIR_COUNT,
  pickPairIconKeys,
  resolveMatchMismatch,
  selectMatchCard,
} from "@/components/run/MatchGame"
import * as rewardBestScores from "@/components/run/rewardBestScores"
import {
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"

const matchAudioApi = vi.hoisted(() => ({
  resume: vi.fn().mockResolvedValue(undefined),
  playFlip: vi.fn(),
  playMatch: vi.fn(),
  playCheer: vi.fn(),
  playNewBest: vi.fn(),
  stop: vi.fn(),
}))

vi.mock("@/components/run/matchAudio", () => ({
  createMatchAudio: () => matchAudioApi,
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

/** Deterministic “random”: always pick the last index (stable reverse-ish). */
function alwaysZero() {
  return 0
}

describe("match board helpers", () => {
  it("includes the theme icon among six pair keys", () => {
    const keys = pickPairIconKeys("apple", alwaysZero)
    expect(keys).toHaveLength(MATCH_PAIR_COUNT)
    expect(keys).toContain("apple")
  })

  it("deals twelve cards with six pairs including theme", () => {
    const board = dealMatchBoard("apple", alwaysZero)
    expect(board.cards).toHaveLength(MATCH_CARD_COUNT)
    expect(board.pairsMatched).toBe(0)
    const themeCards = board.cards.filter((card) => card.iconKey === "apple")
    expect(themeCards).toHaveLength(2)
  })

  it("matches two equal cards and clears when all pairs found", () => {
    let board = dealMatchBoard("apple", alwaysZero)
    const first = board.cards[0]
    const mate = board.cards.find(
      (card) => card.id !== first?.id && card.iconKey === first?.iconKey,
    )
    expect(first).toBeTruthy()
    expect(mate).toBeTruthy()
    board = selectMatchCard(board, first!.id)
    board = selectMatchCard(board, mate!.id)
    expect(board.pairsMatched).toBe(1)
    expect(board.openIds).toHaveLength(0)
    expect(board.cards.find((card) => card.id === first!.id)?.matched).toBe(
      true,
    )

    // Finish the rest by matching remaining pairs greedily.
    while (!isBoardCleared(board)) {
      const next = board.cards.find((card) => !card.matched)
      const pair = board.cards.find(
        (card) =>
          !card.matched &&
          card.id !== next?.id &&
          card.iconKey === next?.iconKey,
      )
      if (!next || !pair) {
        break
      }
      board = selectMatchCard(board, next.id)
      board = selectMatchCard(board, pair.id)
    }
    expect(isBoardCleared(board)).toBe(true)
    expect(board.pairsMatched).toBe(MATCH_PAIR_COUNT)
  })

  it("marks a mismatch as resolving then flips back", () => {
    const board = dealMatchBoard("apple", alwaysZero)
    const first = board.cards[0]!
    const other = board.cards.find(
      (card) => card.iconKey !== first.iconKey,
    )!
    let next = selectMatchCard(board, first.id)
    next = selectMatchCard(next, other.id)
    expect(next.resolving).toBe(true)
    expect(next.openIds).toHaveLength(2)
    next = resolveMatchMismatch(next)
    expect(next.resolving).toBe(false)
    expect(next.openIds).toHaveLength(0)
    expect(next.cards.find((card) => card.id === first.id)?.faceUp).toBe(false)
    expect(next.cards.find((card) => card.id === other.id)?.faceUp).toBe(false)
  })
})

describe("MatchGame", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows theme HUD and a 4×3 play grid while playing", () => {
    render(
      <MatchGame food={food} onDone={vi.fn()} random={alwaysZero} />,
    )

    expect(screen.getByLabelText("Match game: Apples")).toBeInTheDocument()
    expect(screen.getByText(/Theme: Apples \(Honeycrisp\)/)).toBeInTheDocument()
    expect(screen.getByLabelText("Match play area")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Match" }).className).toBe(
      RUN_GAME_TITLE,
    )
    expect(screen.getByText(/Pairs:/).parentElement?.className).toBe(
      RUN_GAME_HUD,
    )
    expect(screen.getAllByTestId("match-card")).toHaveLength(MATCH_CARD_COUNT)
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()
    expect(
      screen.getAllByTestId("match-card").some(
        (node) => node.getAttribute("data-icon") === "apple",
      ),
    ).toBe(true)
  })

  it("ends the round and shows Best on the finish screen", async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(
      <MatchGame
        food={food}
        onDone={onDone}
        roundMs={200}
        random={alwaysZero}
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByLabelText("Match finished")).toBeInTheDocument()
    const finishTitle = screen.getByText(/Nice matching/)
    expect(finishTitle.className).toBe(RUN_GAME_FINISH_TITLE)
    expect(screen.getByText(/Best:/)).toBeInTheDocument()
    expect(screen.queryByText("New best!")).not.toBeInTheDocument()
    expect(matchAudioApi.playCheer).toHaveBeenCalled()
    expect(matchAudioApi.playNewBest).not.toHaveBeenCalled()

    screen.getByRole("button", { name: "Done" }).click()
    expect(onDone).toHaveBeenCalled()
  })

  it("shows New best! when recordScore reports a new best", async () => {
    vi.useFakeTimers()
    vi.spyOn(rewardBestScores, "recordScore").mockReturnValue({
      best: 4,
      isNewBest: true,
    })
    render(
      <MatchGame
        food={food}
        onDone={vi.fn()}
        roundMs={200}
        householdId="hh-match"
        random={alwaysZero}
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText("New best!")).toBeInTheDocument()
    expect(screen.getByText("Best: 4")).toBeInTheDocument()
    expect(rewardBestScores.recordScore).toHaveBeenCalledWith(
      "match",
      expect.any(Number),
      "hh-match",
    )
    expect(matchAudioApi.playNewBest).toHaveBeenCalled()
    expect(matchAudioApi.playCheer).not.toHaveBeenCalled()
  })

  it("finishes early when all pairs are matched", async () => {
    const user = userEvent.setup()
    render(
      <MatchGame
        food={food}
        onDone={vi.fn()}
        roundMs={60_000}
        random={alwaysZero}
      />,
    )

    const cards = screen.getAllByTestId("match-card")
    const byIcon = new Map<string, HTMLElement[]>()
    for (const card of cards) {
      const icon = card.getAttribute("data-icon") ?? ""
      const list = byIcon.get(icon) ?? []
      list.push(card)
      byIcon.set(icon, list)
    }

    for (const pair of byIcon.values()) {
      await user.click(pair[0]!)
      await user.click(pair[1]!)
    }

    expect(await screen.findByLabelText("Match finished")).toBeInTheDocument()
    expect(screen.getByText(/You matched 6 pairs/)).toBeInTheDocument()
  })
})
