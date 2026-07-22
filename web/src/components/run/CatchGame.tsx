import { useEffect, useRef, useState } from "react"

import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { createCatchAudio } from "@/components/run/catchAudio"
import {
  RUN_GAME_FINISH_SUB,
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_THEME,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"
import { Button } from "@/components/ui/button"

export const CATCH_ROUND_MS = 30_000
export const CATCHER_WIDTH = 22
export const PIECE_SIZE = 10
const SPAWN_EVERY_MS = 900
const TICK_MS = 50
export const FALL_SPEED = 2.2
/** Let the end cheer finish before closing AudioContext. */
const CHEER_THEN_STOP_MS = 650

type Piece = {
  id: number
  x: number
  y: number
}

type Board = {
  pieces: Piece[]
  score: number
}

type CatchGameProps = {
  food: SessionFoodResponse
  onDone: () => void
  /** Override round length (ms) — tests use a short value. */
  roundMs?: number
}

/** Pure tick — safe under React Strict Mode double-invoked updaters. */
export function advanceBoard(board: Board, catcherX: number): Board {
  let caught = 0
  const moved: Piece[] = []
  const catcherLeft = catcherX
  const catcherRight = catcherLeft + CATCHER_WIDTH

  for (const piece of board.pieces) {
    const y = piece.y + FALL_SPEED
    if (y >= 100) {
      continue
    }
    const pieceCenter = piece.x + PIECE_SIZE / 2
    const overCatcher =
      y >= 82 &&
      y <= 96 &&
      pieceCenter >= catcherLeft &&
      pieceCenter <= catcherRight
    if (overCatcher) {
      caught += 1
      continue
    }
    moved.push({ ...piece, y })
  }

  return {
    pieces: moved,
    score: board.score + caught,
  }
}

export function CatchGame({
  food,
  onDone,
  roundMs = CATCH_ROUND_MS,
}: CatchGameProps) {
  const [catcherX, setCatcherX] = useState(50 - CATCHER_WIDTH / 2)
  const [board, setBoard] = useState<Board>({ pieces: [], score: 0 })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const nextId = useRef(1)
  const catcherXRef = useRef(catcherX)
  catcherXRef.current = catcherX
  const audioRef = useRef(createCatchAudio())
  const cheerStopTimer = useRef<number | null>(null)

  const remainingMs = Math.max(0, roundMs - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const themeLabel = food.variantNote
    ? `${food.name} (${food.variantNote})`
    : food.name

  function armAudio() {
    const audio = audioRef.current
    void audio?.resume().then(() => {
      audio?.startBed()
    })
  }

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (cheerStopTimer.current !== null) {
        window.clearTimeout(cheerStopTimer.current)
      }
      audio?.stop()
    }
  }, [])

  useEffect(() => {
    if (!finished) {
      return
    }
    const audio = audioRef.current
    audio?.playCheer()
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

      setBoard((current) => {
        const next = advanceBoard(current, catcherXRef.current)
        const gained = next.score - current.score
        if (gained > 0) {
          window.setTimeout(() => {
            for (let i = 0; i < gained; i += 1) {
              audioRef.current?.playCatch()
            }
          }, 0)
        }
        return next
      })
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
      setBoard((current) => ({
        ...current,
        pieces: [
          ...current.pieces,
          {
            id,
            x: Math.random() * (100 - PIECE_SIZE),
            y: -PIECE_SIZE,
          },
        ],
      }))
    }, SPAWN_EVERY_MS)
    return () => window.clearInterval(spawn)
  }, [finished])

  function moveCatcher(delta: number) {
    if (finished) {
      return
    }
    armAudio()
    setCatcherX((current) =>
      Math.min(100 - CATCHER_WIDTH, Math.max(0, current + delta)),
    )
  }

  function onPlayAreaPointer(clientX: number, target: HTMLElement) {
    if (finished) {
      return
    }
    armAudio()
    const rect = target.getBoundingClientRect()
    if (rect.width <= 0) {
      return
    }
    const ratio = ((clientX - rect.left) / rect.width) * 100
    setCatcherX(
      Math.min(100 - CATCHER_WIDTH, Math.max(0, ratio - CATCHER_WIDTH / 2)),
    )
  }

  return (
    <div
      className="flex h-full flex-col gap-4 p-4"
      aria-label={`Catch game: ${food.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FoodIcon iconKey={food.iconKey} name={food.name} className="size-12 shrink-0" />
          <div className="min-w-0">
            <h2 className={RUN_GAME_TITLE}>Catch</h2>
            <p className={RUN_GAME_THEME}>Theme: {themeLabel}</p>
          </div>
        </div>
        <div className={RUN_GAME_HUD}>
          <p aria-live="polite">Caught: {board.score}</p>
          <p aria-live="polite">
            {finished ? "Time!" : `${remainingSec}s`}
          </p>
        </div>
      </div>

      {finished ? (
        <div
          className="run-enter flex flex-1 flex-col items-center justify-center gap-4 text-center"
          aria-label="Catch finished"
        >
          <p className={RUN_GAME_FINISH_TITLE}>Nice catching!</p>
          <p className={RUN_GAME_FINISH_SUB}>
            You caught {board.score} {food.name.toLowerCase()}
            {board.score === 1 ? "" : "s"}.
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
            className="run-play-frame relative min-h-[280px] flex-1 overflow-hidden"
            role="application"
            aria-label="Catch play area"
            onPointerMove={(event) =>
              onPlayAreaPointer(event.clientX, event.currentTarget)
            }
            onPointerDown={(event) =>
              onPlayAreaPointer(event.clientX, event.currentTarget)
            }
          >
            {board.pieces.map((piece) => (
              <div
                key={piece.id}
                className="pointer-events-none absolute"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  width: `${PIECE_SIZE}%`,
                }}
                data-testid="falling-piece"
              >
                <FoodIcon
                  iconKey={food.iconKey}
                  name={food.name}
                  className="size-full"
                />
              </div>
            ))}
            <div
              className="run-basket absolute bottom-2"
              style={{
                left: `${catcherX}%`,
                width: `${CATCHER_WIDTH}%`,
              }}
              data-testid="catcher"
              aria-label="Basket"
            >
              <span className="run-basket-rim" aria-hidden />
              <span className="run-basket-bowl" aria-hidden />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-14 min-w-28 text-lg"
              onClick={() => moveCatcher(-12)}
              aria-label="Move basket left"
            >
              Left
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-14 min-w-28 text-lg"
              onClick={() => moveCatcher(12)}
              aria-label="Move basket right"
            >
              Right
            </Button>
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
