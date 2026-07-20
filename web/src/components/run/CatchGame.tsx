import { useEffect, useRef, useState } from "react"

import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { Button } from "@/components/ui/button"

export const CATCH_ROUND_MS = 30_000
const CATCHER_WIDTH = 22
const PIECE_SIZE = 10
const SPAWN_EVERY_MS = 900
const TICK_MS = 50
const FALL_SPEED = 2.2

type Piece = {
  id: number
  x: number
  y: number
}

type CatchGameProps = {
  food: SessionFoodResponse
  onDone: () => void
  /** Override round length (ms) — tests use a short value. */
  roundMs?: number
}

export function CatchGame({
  food,
  onDone,
  roundMs = CATCH_ROUND_MS,
}: CatchGameProps) {
  const [catcherX, setCatcherX] = useState(50 - CATCHER_WIDTH / 2)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [score, setScore] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const nextId = useRef(1)
  const catcherXRef = useRef(catcherX)
  catcherXRef.current = catcherX

  const remainingMs = Math.max(0, roundMs - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const themeLabel = food.variantNote
    ? `${food.name} (${food.variantNote})`
    : food.name

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

      setPieces((current) => {
        let caught = 0
        const moved: Piece[] = []
        for (const piece of current) {
          const y = piece.y + FALL_SPEED
          if (y >= 100) {
            continue
          }
          const catcherLeft = catcherXRef.current
          const catcherRight = catcherLeft + CATCHER_WIDTH
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
        if (caught > 0) {
          setScore((value) => value + caught)
        }
        return moved
      })
    }, TICK_MS)

    return () => window.clearInterval(tick)
  }, [finished, roundMs])

  useEffect(() => {
    if (finished) {
      return
    }
    const spawn = window.setInterval(() => {
      setPieces((current) => [
        ...current,
        {
          id: nextId.current++,
          x: Math.random() * (100 - PIECE_SIZE),
          y: -PIECE_SIZE,
        },
      ])
    }, SPAWN_EVERY_MS)
    return () => window.clearInterval(spawn)
  }, [finished])

  function moveCatcher(delta: number) {
    if (finished) {
      return
    }
    setCatcherX((current) =>
      Math.min(100 - CATCHER_WIDTH, Math.max(0, current + delta)),
    )
  }

  function onPlayAreaPointer(clientX: number, target: HTMLElement) {
    if (finished) {
      return
    }
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
            <h2 className="text-xl font-semibold tracking-tight">Catch</h2>
            <p className="truncate text-sm text-muted-foreground">
              Theme: {themeLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <p aria-live="polite">Caught: {score}</p>
          <p aria-live="polite">
            {finished ? "Time!" : `${remainingSec}s`}
          </p>
        </div>
      </div>

      {finished ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
          aria-label="Catch finished"
        >
          <p className="text-2xl font-semibold">Nice catching!</p>
          <p className="text-lg text-muted-foreground">
            You caught {score} {food.name.toLowerCase()}
            {score === 1 ? "" : "s"}.
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
            className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-border bg-muted/40"
            role="application"
            aria-label="Catch play area"
            onPointerMove={(event) =>
              onPlayAreaPointer(event.clientX, event.currentTarget)
            }
            onPointerDown={(event) =>
              onPlayAreaPointer(event.clientX, event.currentTarget)
            }
          >
            {pieces.map((piece) => (
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
              className="absolute bottom-3 h-10 rounded-xl border-2 border-primary bg-primary/20"
              style={{
                left: `${catcherX}%`,
                width: `${CATCHER_WIDTH}%`,
              }}
              data-testid="catcher"
              aria-label="Basket"
            />
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
