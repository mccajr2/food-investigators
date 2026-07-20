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
        className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center"
        aria-label="Encouragement"
      >
        <h2 className="text-2xl font-semibold tracking-tight">Nice try tonight</h2>
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
        className="flex h-full flex-col items-center justify-center gap-6 p-6"
        aria-label="Pick food for game"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-center">
          Which food for your game?
        </h2>
        <p className="text-center text-muted-foreground">
          You ate enough of both — pick one to theme Catch.
        </p>
        <ul className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
          {phase.foods.map((food) => (
            <li key={`${food.foodId}-${food.position}`} className="flex-1">
              <button
                type="button"
                className="flex w-full min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-lg font-medium hover:border-primary"
                onClick={() => onPick(food)}
              >
                <FoodIcon
                  iconKey={food.iconKey}
                  name={food.name}
                  className="size-14"
                />
                <span>
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
