import type { SessionFoodResponse } from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { Button } from "@/components/ui/button"

/**
 * Stub Catch surface for wiring the post-complete reward flow.
 * Full playable Catch lands in the next task.
 */
export function CatchGame({
  food,
  onDone,
}: {
  food: SessionFoodResponse
  onDone: () => void
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center"
      aria-label={`Catch game: ${food.name}`}
    >
      <FoodIcon iconKey={food.iconKey} name={food.name} className="size-24" />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Catch</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Theme: {food.name}
          {food.variantNote ? ` (${food.variantNote})` : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mini-game coming next — tap Done when you are finished.
        </p>
      </div>
      <Button type="button" size="lg" className="min-h-14 min-w-40 text-lg" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
