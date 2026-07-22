import { useEffect } from "react"

import type { SessionFoodResponse } from "@/api/types"
import { BrandLogo } from "@/components/BrandLogo"
import { FoodIcon } from "@/components/food/FoodIcon"
import { CatchGame } from "@/components/run/CatchGame"
import { CrossGame } from "@/components/run/CrossGame"
import {
  gameLabel,
  phaseForGame,
  phaseForSurprise,
  SURPRISE_REVEAL_MS,
  type RewardGameKind,
  type RewardPhase,
} from "@/components/run/rewardFoods"
import { Button } from "@/components/ui/button"

type RewardFlowProps = {
  phase: RewardPhase
  onPick: (food: SessionFoodResponse) => void
  onChooseGame: (phase: RewardPhase) => void
  onFinished: () => void
}

const GAME_OPTIONS: {
  game: RewardGameKind | "surprise"
  label: string
  symbol: string
  hint: string
}[] = [
  {
    game: "catch",
    label: "Catch",
    symbol: "🧺",
    hint: "Catch falling food",
  },
  {
    game: "cross",
    label: "Cross",
    symbol: "🐸",
    hint: "Cross the lanes",
  },
  {
    game: "surprise",
    label: "Surprise",
    symbol: "✨",
    hint: "Catch or Cross — surprise!",
  },
]

export function RewardFlow({
  phase,
  onPick,
  onChooseGame,
  onFinished,
}: RewardFlowProps) {
  useEffect(() => {
    if (phase.kind !== "surpriseReveal") {
      return
    }
    const timer = window.setTimeout(() => {
      onChooseGame(phaseForGame(phase.game, phase.food))
    }, SURPRISE_REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [phase, onChooseGame])

  if (phase.kind === "encourage") {
    return (
      <div
        className="run-enter flex h-full flex-col items-center justify-center gap-6 p-6 text-center"
        aria-label="Encouragement"
      >
        <BrandLogo variant="full" className="max-w-[14rem] sm:max-w-xs" />
        <h2 className="run-prompt text-3xl leading-tight md:text-4xl">
          Nice try tonight
        </h2>
        <p className="max-w-md text-lg text-muted-foreground">
          Eating enough can be hard. You can try again another night — we will
          be ready with a game when you do.
        </p>
        <Button
          type="button"
          size="lg"
          className="min-h-14 min-w-40 text-lg"
          onClick={onFinished}
        >
          Back to Plan
        </Button>
      </div>
    )
  }

  if (phase.kind === "pick") {
    return (
      <div
        className="run-enter flex h-full flex-col items-center justify-center gap-6 p-6"
        aria-label="Pick food for game"
      >
        <h2 className="run-prompt text-center text-3xl leading-tight md:text-4xl">
          Which food for your game?
        </h2>
        <p className="text-center text-muted-foreground">
          You ate enough of both — pick one to theme your game.
        </p>
        <ul className="flex w-full max-w-lg flex-col gap-4 sm:flex-row">
          {phase.foods.map((food) => (
            <li key={`${food.foodId}-${food.position}`} className="flex-1">
              <button
                type="button"
                className="run-placemat flex w-full min-h-32 flex-col items-center justify-center gap-2 p-5 text-lg hover:brightness-[1.03]"
                onClick={() => onPick(food)}
              >
                <FoodIcon
                  iconKey={food.iconKey}
                  name={food.name}
                  className="size-14"
                />
                <span className="run-prompt">
                  {food.name}
                  {food.variantNote ? ` (${food.variantNote})` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (phase.kind === "pickGame") {
    return (
      <div
        className="run-enter flex h-full flex-col items-center justify-center gap-6 p-6"
        aria-label="Pick game"
      >
        <BrandLogo variant="full" className="max-w-[14rem] sm:max-w-xs" />
        <div className="flex flex-col items-center gap-2 text-center">
          <FoodIcon
            iconKey={phase.food.iconKey}
            name={phase.food.name}
            className="size-14"
          />
          <h2 className="run-prompt text-3xl leading-tight md:text-4xl">
            Which game?
          </h2>
          <p className="text-muted-foreground">
            Theme:{" "}
            {phase.food.variantNote
              ? `${phase.food.name} (${phase.food.variantNote})`
              : phase.food.name}
          </p>
        </div>
        <ul className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {GAME_OPTIONS.map((option) => (
            <li key={option.game}>
              <button
                type="button"
                className="run-placemat flex w-full min-h-32 flex-col items-center justify-center gap-2 p-5 text-center hover:brightness-[1.03]"
                aria-label={option.label}
                onClick={() => {
                  if (option.game === "surprise") {
                    onChooseGame(phaseForSurprise(phase.food))
                    return
                  }
                  onChooseGame(phaseForGame(option.game, phase.food))
                }}
              >
                <span className="text-4xl" aria-hidden>
                  {option.symbol}
                </span>
                <span className="run-prompt text-xl">{option.label}</span>
                <span className="text-sm text-muted-foreground">
                  {option.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (phase.kind === "surpriseReveal") {
    const label = gameLabel(phase.game)
    return (
      <div
        className="run-enter flex h-full flex-col items-center justify-center gap-6 p-6 text-center"
        aria-label="Surprise reveal"
        aria-live="polite"
      >
        <BrandLogo variant="full" className="max-w-[14rem] sm:max-w-xs" />
        <p className="text-5xl" aria-hidden>
          ✨
        </p>
        <h2 className="run-prompt text-3xl leading-tight md:text-4xl">
          Surprise: {label}!
        </h2>
        <p className="text-muted-foreground">Get ready…</p>
        <Button
          type="button"
          size="lg"
          className="min-h-14 min-w-40 text-lg"
          onClick={() => onChooseGame(phaseForGame(phase.game, phase.food))}
        >
          Let&apos;s go
        </Button>
      </div>
    )
  }

  if (phase.kind === "cross") {
    return <CrossGame food={phase.food} onDone={onFinished} />
  }

  return <CatchGame food={phase.food} onDone={onFinished} />
}
