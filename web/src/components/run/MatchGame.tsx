import { useEffect, useRef, useState } from "react"

import { FOOD_ICON_KEYS } from "@/api/types"
import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { createMatchAudio } from "@/components/run/matchAudio"
import {
  recordScore,
  type RecordScoreResult,
} from "@/components/run/rewardBestScores"
import {
  RUN_GAME_CELEBRATE,
  RUN_GAME_FINISH_SUB,
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_THEME,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const MATCH_ROUND_MS = 30_000
export const MATCH_COLS = 4
export const MATCH_ROWS = 3
export const MATCH_PAIR_COUNT = 6
export const MATCH_CARD_COUNT = MATCH_PAIR_COUNT * 2
/** Brief pause before mismatched cards flip back. */
export const MATCH_MISMATCH_MS = 650
const TICK_MS = 100
/** Let the end cheer finish before closing AudioContext. */
const CHEER_THEN_STOP_MS = 650
/** New-best fanfare is longer than the normal end cheer. */
const NEW_BEST_THEN_STOP_MS = 900

export type MatchCard = {
  id: number
  iconKey: string
  matched: boolean
  faceUp: boolean
}

export type MatchBoard = {
  cards: MatchCard[]
  /** Unmatched cards currently face-up (0–2). */
  openIds: number[]
  pairsMatched: number
  /** True while a mismatch is waiting to flip back. */
  resolving: boolean
}

type MatchGameProps = {
  food: SessionFoodResponse
  onDone: () => void
  /** Override round length (ms) — tests use a short value. */
  roundMs?: number
  householdId?: string | null
  /** Injectable RNG for deal shuffle (tests). */
  random?: () => number
}

function shuffleInPlace<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const current = items[index]
    items[index] = items[swap] as T
    items[swap] = current as T
  }
  return items
}

/** Theme food + fillers from the starter icon set (always 6 pair keys). */
export function pickPairIconKeys(
  themeIconKey: string,
  random: () => number = Math.random,
): string[] {
  const fillers = FOOD_ICON_KEYS.filter((key) => key !== themeIconKey)
  shuffleInPlace(fillers, random)
  const keys = [themeIconKey, ...fillers.slice(0, MATCH_PAIR_COUNT - 1)]
  while (keys.length < MATCH_PAIR_COUNT) {
    keys.push(FOOD_ICON_KEYS[keys.length % FOOD_ICON_KEYS.length] ?? "apple")
  }
  return keys.slice(0, MATCH_PAIR_COUNT)
}

export function dealMatchBoard(
  themeIconKey: string,
  random: () => number = Math.random,
): MatchBoard {
  const pairKeys = pickPairIconKeys(themeIconKey, random)
  const cards: MatchCard[] = []
  let id = 0
  for (const iconKey of pairKeys) {
    cards.push({ id: id++, iconKey, matched: false, faceUp: false })
    cards.push({ id: id++, iconKey, matched: false, faceUp: false })
  }
  shuffleInPlace(cards, random)
  return {
    cards,
    openIds: [],
    pairsMatched: 0,
    resolving: false,
  }
}

export function isBoardCleared(board: MatchBoard): boolean {
  return board.pairsMatched >= MATCH_PAIR_COUNT
}

/**
 * Flip a face-down card. When two are open, either match (stay up) or mark
 * `resolving` so the UI can flip them back after a short delay.
 */
export function selectMatchCard(board: MatchBoard, cardId: number): MatchBoard {
  if (board.resolving || isBoardCleared(board)) {
    return board
  }
  const card = board.cards.find((item) => item.id === cardId)
  if (!card || card.matched || card.faceUp) {
    return board
  }
  if (board.openIds.length >= 2) {
    return board
  }

  const cards = board.cards.map((item) =>
    item.id === cardId ? { ...item, faceUp: true } : item,
  )
  const openIds = [...board.openIds, cardId]
  if (openIds.length < 2) {
    return { ...board, cards, openIds }
  }

  const first = cards.find((item) => item.id === openIds[0])
  const second = cards.find((item) => item.id === openIds[1])
  if (!first || !second) {
    return { ...board, cards, openIds: [] }
  }

  if (first.iconKey === second.iconKey) {
    const matched = cards.map((item) =>
      openIds.includes(item.id) ? { ...item, matched: true, faceUp: true } : item,
    )
    return {
      cards: matched,
      openIds: [],
      pairsMatched: board.pairsMatched + 1,
      resolving: false,
    }
  }

  return {
    ...board,
    cards,
    openIds,
    resolving: true,
  }
}

/** Flip mismatched open cards face-down again. */
export function resolveMatchMismatch(board: MatchBoard): MatchBoard {
  if (!board.resolving) {
    return board
  }
  const cards = board.cards.map((item) =>
    board.openIds.includes(item.id) && !item.matched
      ? { ...item, faceUp: false }
      : item,
  )
  return {
    ...board,
    cards,
    openIds: [],
    resolving: false,
  }
}

export function MatchGame({
  food,
  onDone,
  roundMs = MATCH_ROUND_MS,
  householdId = null,
  random = Math.random,
}: MatchGameProps) {
  const [board, setBoard] = useState<MatchBoard>(() =>
    dealMatchBoard(food.iconKey, random),
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const [finishBest, setFinishBest] = useState<RecordScoreResult | null>(null)
  const finishHandledRef = useRef(false)
  const mismatchTimer = useRef<number | null>(null)
  const audioRef = useRef(createMatchAudio())
  const cheerStopTimer = useRef<number | null>(null)

  const remainingMs = Math.max(0, roundMs - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const themeLabel = food.variantNote
    ? `${food.name} (${food.variantNote})`
    : food.name

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (mismatchTimer.current !== null) {
        window.clearTimeout(mismatchTimer.current)
      }
      if (cheerStopTimer.current !== null) {
        window.clearTimeout(cheerStopTimer.current)
      }
      audio?.stop()
    }
  }, [])

  useEffect(() => {
    if (!finished || finishHandledRef.current) {
      return
    }
    finishHandledRef.current = true
    const result = recordScore("match", board.pairsMatched, householdId)
    setFinishBest(result)
    const audio = audioRef.current
    if (result.isNewBest) {
      audio?.playNewBest()
    } else {
      audio?.playCheer()
    }
    if (cheerStopTimer.current !== null) {
      window.clearTimeout(cheerStopTimer.current)
    }
    cheerStopTimer.current = window.setTimeout(
      () => {
        audio?.stop()
        cheerStopTimer.current = null
      },
      result.isNewBest ? NEW_BEST_THEN_STOP_MS : CHEER_THEN_STOP_MS,
    )
  }, [finished, board.pairsMatched, householdId])

  useEffect(() => {
    if (finished) {
      return
    }
    const tick = window.setInterval(() => {
      setElapsedMs((current) => {
        const next = current + TICK_MS
        if (next >= roundMs) {
          setFinished(true)
          return roundMs
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(tick)
  }, [finished, roundMs])

  useEffect(() => {
    if (!board.resolving || finished) {
      return
    }
    if (mismatchTimer.current !== null) {
      window.clearTimeout(mismatchTimer.current)
    }
    mismatchTimer.current = window.setTimeout(() => {
      setBoard((current) => resolveMatchMismatch(current))
      mismatchTimer.current = null
    }, MATCH_MISMATCH_MS)
    return () => {
      if (mismatchTimer.current !== null) {
        window.clearTimeout(mismatchTimer.current)
        mismatchTimer.current = null
      }
    }
  }, [board.resolving, finished])

  useEffect(() => {
    if (!finished && isBoardCleared(board)) {
      setFinished(true)
    }
  }, [board, finished])

  function onCardClick(cardId: number) {
    if (finished) {
      return
    }
    const audio = audioRef.current
    void audio?.resume()
    setBoard((current) => {
      const next = selectMatchCard(current, cardId)
      if (next === current) {
        return current
      }
      if (next.pairsMatched > current.pairsMatched) {
        window.setTimeout(() => {
          audio?.playFlip()
          audio?.playMatch()
        }, 0)
      } else if (next.openIds.length > current.openIds.length) {
        window.setTimeout(() => {
          audio?.playFlip()
        }, 0)
      }
      return next
    })
  }

  return (
    <div
      className="flex h-full flex-col gap-4 p-4"
      aria-label={`Match game: ${food.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FoodIcon
            iconKey={food.iconKey}
            name={food.name}
            className="size-12 shrink-0"
          />
          <div className="min-w-0">
            <h2 className={RUN_GAME_TITLE}>Match</h2>
            <p className={RUN_GAME_THEME}>Theme: {themeLabel}</p>
          </div>
        </div>
        <div className={RUN_GAME_HUD}>
          <p aria-live="polite">Pairs: {board.pairsMatched}</p>
          <p aria-live="polite">
            {finished ? "Time!" : `${remainingSec}s`}
          </p>
        </div>
      </div>

      {finished ? (
        <div
          className="run-enter flex flex-1 flex-col items-center justify-center gap-4 text-center"
          aria-label="Match finished"
        >
          <p className={RUN_GAME_FINISH_TITLE}>Nice matching!</p>
          {finishBest?.isNewBest ? (
            <p className={RUN_GAME_CELEBRATE} aria-live="polite">
              New best!
            </p>
          ) : null}
          <p className={RUN_GAME_FINISH_SUB}>
            You matched {board.pairsMatched} pair
            {board.pairsMatched === 1 ? "" : "s"}.
          </p>
          <p className={RUN_GAME_TITLE} aria-live="polite">
            Best: {finishBest?.best ?? board.pairsMatched}
          </p>
          <Button
            type="button"
            size="lg"
            className="min-h-14 min-w-40 text-lg"
            onClick={onDone}
          >
            Done
          </Button>
        </div>
      ) : (
        <>
          <div
            className="run-play-frame grid min-h-[280px] flex-1 gap-2 p-3 md:gap-3"
            role="application"
            aria-label="Match play area"
            style={{
              gridTemplateColumns: `repeat(${MATCH_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${MATCH_ROWS}, minmax(0, 1fr))`,
            }}
          >
            {board.cards.map((card) => {
              const showFace = card.faceUp || card.matched
              return (
                <button
                  key={card.id}
                  type="button"
                  className={cn(
                    "run-match-card flex min-h-16 items-center justify-center md:min-h-20",
                    showFace && "run-match-card--face",
                    card.matched && "run-match-card--matched",
                  )}
                  aria-label={
                    showFace
                      ? `Card showing food ${card.iconKey}`
                      : `Hidden card ${card.id + 1}`
                  }
                  disabled={
                    board.resolving || card.matched || card.faceUp || finished
                  }
                  onClick={() => onCardClick(card.id)}
                  data-testid="match-card"
                  data-face={showFace ? "up" : "down"}
                  data-icon={card.iconKey}
                >
                  {showFace ? (
                    <FoodIcon
                      iconKey={card.iconKey}
                      name={card.iconKey}
                      className="size-10 md:size-12"
                    />
                  ) : (
                    <span className="run-prompt text-2xl text-muted-foreground" aria-hidden>
                      ?
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex justify-center">
            <Button
              type="button"
              size="lg"
              className="min-h-14 min-w-28 text-lg"
              onClick={onDone}
            >
              Done
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
