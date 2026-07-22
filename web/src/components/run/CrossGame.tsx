import { useEffect, useRef, useState } from "react"

import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { createCrossAudio } from "@/components/run/crossAudio"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const CROSS_ROUND_MS = 30_000
/** Rows from bottom (0 = start) to top (GOAL_LANE = goal). */
export const CROSS_LANE_COUNT = 6
export const GOAL_LANE = CROSS_LANE_COUNT - 1
export const CROSS_COLS = 5
export const CROSS_CELEBRATE_MS = 550
/** Let the round-end cheer finish before closing AudioContext. */
const CHEER_THEN_STOP_MS = 650
const TICK_MS = 80
const HAZARD_STEP_EVERY_MS = 400

type Hazard = {
  id: number
  lane: number
  col: number
  dir: 1 | -1
}

export type CrossBoard = {
  playerLane: number
  playerCol: number
  hazards: Hazard[]
  crossings: number
}

export type CrossMove = "up" | "down" | "left" | "right"

type CrossGameProps = {
  food: SessionFoodResponse
  onDone: () => void
  /** Override round length (ms) — tests use a short value. */
  roundMs?: number
}

export function initialCrossBoard(): CrossBoard {
  return {
    playerLane: 0,
    playerCol: Math.floor(CROSS_COLS / 2),
    hazards: [],
    crossings: 0,
  }
}

export function movePlayer(board: CrossBoard, move: CrossMove): CrossBoard {
  let { playerLane, playerCol } = board
  if (move === "up") {
    playerLane = Math.min(GOAL_LANE, playerLane + 1)
  } else if (move === "down") {
    playerLane = Math.max(0, playerLane - 1)
  } else if (move === "left") {
    playerCol = Math.max(0, playerCol - 1)
  } else {
    playerCol = Math.min(CROSS_COLS - 1, playerCol + 1)
  }

  const next = { ...board, playerLane, playerCol }
  if (playerLane === GOAL_LANE) {
    return {
      ...next,
      playerLane: 0,
      playerCol: Math.floor(CROSS_COLS / 2),
      crossings: board.crossings + 1,
    }
  }
  return next
}

/** True when player shares a cell with a hazard. */
export function playerHitHazard(board: CrossBoard): boolean {
  return board.hazards.some(
    (hazard) =>
      hazard.lane === board.playerLane && hazard.col === board.playerCol,
  )
}

/** Forgiving bump: send player back to the start pad. */
export function resetPlayerAfterHit(board: CrossBoard): CrossBoard {
  return {
    ...board,
    playerLane: 0,
    playerCol: Math.floor(CROSS_COLS / 2),
  }
}

/** Pure hazard step — safe under Strict Mode double-invoked updaters. */
export function advanceHazards(board: CrossBoard): CrossBoard {
  const moved = board.hazards
    .map((hazard) => {
      const col = hazard.col + hazard.dir
      if (col < 0 || col >= CROSS_COLS) {
        return null
      }
      return { ...hazard, col }
    })
    .filter((hazard): hazard is Hazard => hazard !== null)

  const next: CrossBoard = { ...board, hazards: moved }
  if (playerHitHazard(next)) {
    return resetPlayerAfterHit(next)
  }
  return next
}

export function spawnHazard(
  board: CrossBoard,
  id: number,
  random: () => number = Math.random,
): CrossBoard {
  const trafficLanes = Array.from(
    { length: GOAL_LANE - 1 },
    (_, index) => index + 1,
  )
  const lane = trafficLanes[Math.floor(random() * trafficLanes.length)] ?? 1
  const dir: 1 | -1 = random() < 0.5 ? 1 : -1
  const col = dir === 1 ? 0 : CROSS_COLS - 1
  const hazard: Hazard = { id, lane, col, dir }
  const next: CrossBoard = {
    ...board,
    hazards: [...board.hazards, hazard],
  }
  if (playerHitHazard(next)) {
    return resetPlayerAfterHit(next)
  }
  return next
}

function keyToMove(key: string): CrossMove | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up"
    case "ArrowDown":
    case "s":
    case "S":
      return "down"
    case "ArrowLeft":
    case "a":
    case "A":
      return "left"
    case "ArrowRight":
    case "d":
    case "D":
      return "right"
    default:
      return null
  }
}

export function CrossGame({
  food,
  onDone,
  roundMs = CROSS_ROUND_MS,
}: CrossGameProps) {
  const [board, setBoard] = useState<CrossBoard>(() => initialCrossBoard())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const nextId = useRef(1)
  const sinceHazardStep = useRef(0)
  const audioRef = useRef(createCrossAudio())
  const celebrateTimer = useRef<number | null>(null)
  const cheerStopTimer = useRef<number | null>(null)
  const finishedRef = useRef(finished)
  finishedRef.current = finished

  const remainingMs = Math.max(0, roundMs - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const themeLabel = food.variantNote
    ? `${food.name} (${food.variantNote})`
    : food.name

  function flashCelebrate() {
    setCelebrating(true)
    if (celebrateTimer.current !== null) {
      window.clearTimeout(celebrateTimer.current)
    }
    celebrateTimer.current = window.setTimeout(() => {
      setCelebrating(false)
      celebrateTimer.current = null
    }, CROSS_CELEBRATE_MS)
  }

  function applyMove(move: CrossMove) {
    if (finishedRef.current) {
      return
    }
    const audio = audioRef.current
    void audio?.resume().then(() => {
      audio?.startBed()
    })
    audio?.playJump()

    setBoard((current) => {
      const moved = movePlayer(current, move)
      if (playerHitHazard(moved)) {
        window.setTimeout(() => {
          audio?.playOuch()
        }, 0)
        return resetPlayerAfterHit(moved)
      }
      if (moved.crossings > current.crossings) {
        window.setTimeout(() => {
          audio?.playCrossing()
          flashCelebrate()
        }, 0)
      }
      return moved
    })
  }

  const applyMoveRef = useRef(applyMove)
  applyMoveRef.current = applyMove

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.stop()
      if (celebrateTimer.current !== null) {
        window.clearTimeout(celebrateTimer.current)
      }
      if (cheerStopTimer.current !== null) {
        window.clearTimeout(cheerStopTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!finished) {
      return
    }
    const audio = audioRef.current
    audio?.playCrossing()
    if (cheerStopTimer.current !== null) {
      window.clearTimeout(cheerStopTimer.current)
    }
    cheerStopTimer.current = window.setTimeout(() => {
      audio?.stop()
      cheerStopTimer.current = null
    }, CHEER_THEN_STOP_MS)
  }, [finished])

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

      sinceHazardStep.current += TICK_MS
      if (sinceHazardStep.current >= HAZARD_STEP_EVERY_MS) {
        sinceHazardStep.current = 0
        setBoard((current) => {
          const next = advanceHazards(current)
          if (
            current.playerLane !== next.playerLane ||
            current.playerCol !== next.playerCol
          ) {
            window.setTimeout(() => {
              audioRef.current?.playOuch()
            }, 0)
          }
          return next
        })
      }
    }, TICK_MS)

    return () => window.clearInterval(tick)
  }, [finished, roundMs])

  useEffect(() => {
    if (finished) {
      return
    }
    const spawn = window.setInterval(() => {
      const id = nextId.current
      nextId.current += 1
      setBoard((current) => {
        const next = spawnHazard(current, id)
        if (
          current.playerLane !== next.playerLane ||
          current.playerCol !== next.playerCol
        ) {
          window.setTimeout(() => {
            audioRef.current?.playOuch()
          }, 0)
        }
        return next
      })
    }, 1200)
    return () => window.clearInterval(spawn)
  }, [finished])

  useEffect(() => {
    if (finished) {
      return
    }
    function onKeyDown(event: KeyboardEvent) {
      const move = keyToMove(event.key)
      if (!move) {
        return
      }
      event.preventDefault()
      applyMoveRef.current(move)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [finished])
  return (
    <div
      className="flex h-full flex-col gap-4 p-4"
      aria-label={`Cross game: ${food.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FoodIcon
            iconKey={food.iconKey}
            name={food.name}
            className="size-12 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="run-prompt text-xl md:text-2xl">Cross</h2>
            <p className="truncate text-sm text-muted-foreground">
              Theme: {themeLabel}
            </p>
          </div>
        </div>
        <div className="run-prompt flex items-center gap-4 text-base font-medium md:text-lg">
          <p aria-live="polite">Crossings: {board.crossings}</p>
          <p aria-live="polite">{finished ? "Time!" : `${remainingSec}s`}</p>
        </div>
      </div>

      {finished ? (
        <div
          className="run-enter flex flex-1 flex-col items-center justify-center gap-4 text-center"
          aria-label="Cross finished"
        >
          <p className="run-prompt text-3xl md:text-4xl">Nice crossing!</p>
          <p className="text-lg text-muted-foreground">
            You crossed {board.crossings} time
            {board.crossings === 1 ? "" : "s"}.
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
            className={cn(
              "run-play-frame relative grid min-h-[280px] flex-1 gap-1 p-3",
              celebrating && "cross-celebrate",
            )}
            role="application"
            aria-label="Cross play area"
            style={{
              gridTemplateRows: `repeat(${CROSS_LANE_COUNT}, minmax(0, 1fr))`,
            }}
          >
            {celebrating ? (
              <p
                className="cross-celebrate-banner run-prompt pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-2xl md:text-3xl"
                aria-live="polite"
              >
                Crossed!
              </p>
            ) : null}
            {Array.from({ length: CROSS_LANE_COUNT }, (_, fromTop) => {
              const lane = GOAL_LANE - fromTop
              const isGoal = lane === GOAL_LANE
              const isStart = lane === 0
              return (
                <div
                  key={lane}
                  className={
                    isGoal
                      ? "grid grid-cols-5 gap-1 rounded-xl bg-primary/15"
                      : isStart
                        ? "grid grid-cols-5 gap-1 rounded-xl bg-secondary/80"
                        : "grid grid-cols-5 gap-1 rounded-xl bg-muted/50"
                  }
                  data-testid={`cross-lane-${lane}`}
                >
                  {Array.from({ length: CROSS_COLS }, (_, col) => {
                    const hasPlayer =
                      board.playerLane === lane && board.playerCol === col
                    const hazard = board.hazards.find(
                      (item) => item.lane === lane && item.col === col,
                    )
                    return (
                      <div
                        key={col}
                        className="relative flex items-center justify-center"
                      >
                        {hazard ? (
                          <span
                            className="run-catcher flex size-10 items-center justify-center text-lg md:size-12"
                            data-testid="cross-hazard"
                            aria-hidden
                          >
                            ▨
                          </span>
                        ) : null}
                        {hasPlayer ? (
                          <div
                            className="size-10 md:size-12"
                            data-testid="cross-player"
                            aria-label="You"
                          >
                            <FoodIcon
                              iconKey={food.iconKey}
                              name={food.name}
                              className="size-full"
                            />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-end justify-center gap-6">
            <div
              className="grid grid-cols-3 gap-2"
              role="group"
              aria-label="Move controls"
            >
              <span className="col-start-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="run-placemat min-h-14 min-w-14 text-lg"
                  onClick={() => applyMove("up")}
                  aria-label="Move up"
                >
                  ▲
                </Button>
              </span>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="run-placemat col-start-1 min-h-14 min-w-14 text-lg"
                onClick={() => applyMove("left")}
                aria-label="Move left"
              >
                ◀
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="run-placemat col-start-2 min-h-14 min-w-14 text-lg"
                onClick={() => applyMove("down")}
                aria-label="Move down"
              >
                ▼
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="run-placemat col-start-3 min-h-14 min-w-14 text-lg"
                onClick={() => applyMove("right")}
                aria-label="Move right"
              >
                ▶
              </Button>
            </div>
            <Button
              type="button"
              size="lg"
              className="min-h-14 min-w-28 text-lg"
              onClick={onDone}
            >
              Done
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Tip: arrow keys or WASD also work on a keyboard.
          </p>
        </>
      )}
    </div>
  )
}
