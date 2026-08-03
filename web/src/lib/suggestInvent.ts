import type { FoodsClient } from "@/api"
import type {
  Familiarity,
  FoodResponse,
  SessionFoodRequest,
} from "@/api/types"
import { customIconKeyFromName } from "@/lib/generatedFoodIcon"

/** Plan / Suggest food slot that may still be an invent proposal. */
export type SuggestFoodSlot = {
  foodId: string
  familiarity: Familiarity
  variantNote: string
  /** Non-null when Suggest proposed an invent (no catalog id yet). */
  inventName: string | null
}

export function isInventSlot(slot: SuggestFoodSlot): boolean {
  return !slot.foodId && Boolean(slot.inventName?.trim())
}

export function slotIsReady(slot: SuggestFoodSlot): boolean {
  return Boolean(slot.foodId) || Boolean(slot.inventName?.trim())
}

/** Case-insensitive match among active session-eligible tasting foods. */
export function findSelectableByName(
  foods: FoodResponse[],
  name: string,
): FoodResponse | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) {
    return undefined
  }
  return foods.find(
    (food) =>
      food.sessionEligible !== false &&
      !food.archivedAt &&
      food.name.trim().toLowerCase() === needle,
  )
}

/**
 * Resolve a Suggest slot to a real food id. Invent slots match by name or create
 * a household tasting food, then upsert an exposure with the draft familiarity
 * (not auto-safe). Catalog slots pass through.
 */
export async function resolveSuggestSlot(
  slot: SuggestFoodSlot,
  foods: FoodResponse[],
  foodsClient: Pick<FoodsClient, "create" | "upsertExposure">,
): Promise<{
  request: SessionFoodRequest
  createdFood: FoodResponse | null
}> {
  const note = slot.variantNote.trim()
  const variantNote = note.length > 0 ? note : null

  if (slot.foodId) {
    return {
      request: {
        foodId: slot.foodId,
        familiarity: slot.familiarity,
        variantNote,
      },
      createdFood: null,
    }
  }

  const proposed = slot.inventName?.trim()
  if (!proposed) {
    throw new Error("Invent slot is missing a food name")
  }

  let food = findSelectableByName(foods, proposed)
  let createdFood: FoodResponse | null = null
  if (!food) {
    createdFood = await foodsClient.create({
      name: proposed,
      iconKey: customIconKeyFromName(proposed),
      sessionEligible: true,
    })
    food = createdFood
  }

  await foodsClient.upsertExposure(food.id, {
    variantKey: note,
    familiarity: slot.familiarity,
  })

  return {
    request: {
      foodId: food.id,
      familiarity: slot.familiarity,
      variantNote,
    },
    createdFood,
  }
}
