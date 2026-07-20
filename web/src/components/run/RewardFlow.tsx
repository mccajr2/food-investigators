import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { CatchGame } from "@/components/run/CatchGame"
import type { RewardPhase } from "@/components/run/rewardFoods"
import { Button } from "@/components/ui/button"

type RewardFlowProps = {
  phase: RewardPhase
  onPick: (food: SessionFoodResponse) => void
  onFinished: () => void
}

export function RewardFlow({ phase, onPick, onFinished }: RewardFlowProps) {
  if (phase.kind === "encourage") {
    return (
      <div
        className="run-enter flex h-full flex-col items-center justify-center gap-6 p-6 text-center"
        aria-label="Encouragement"
      >
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
          You ate enough of both — pick one to theme Catch.
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

  return <CatchGame food={phase.food} onDone={onFinished} />
}
