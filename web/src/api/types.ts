/** Mirrors schemas in `contracts/openapi.yaml`. */
export type UserResponse = {
  id: string
  email: string
  householdId: string
}

export type AuthResponse = {
  token: string
  user: UserResponse
}

export type RegisterRequest = {
  email: string
  password: string
  rememberMe?: boolean
}

export type LoginRequest = {
  email: string
  password: string
  rememberMe?: boolean
}

export type ErrorMessage = {
  message: string
}

/**
 * Starter illustration keys — keep in sync with backend FoodIconKeys.ALL.
 * Household foods may also use `custom_<slug>` (see generatedFoodIcon.ts).
 */
export const FOOD_ICON_KEYS = [
  "bagel_cream_cheese",
  "ramen",
  "chicken_tenders",
  "apple",
  "strawberry",
  "pancakes_choc_chip",
  "yogurt_plain",
  "bagel",
  "toast",
  "chicken_nuggets",
  "applesauce",
  "banana",
  "blueberry",
  "grape",
  "pancakes_plain",
  "waffle",
  "yogurt_vanilla",
  "carrot",
  "corn",
  "sweet_potato",
] as const

export type FoodIconKey = (typeof FOOD_ICON_KEYS)[number]

export type FoodResponse = {
  id: string
  name: string
  iconKey: FoodIconKey | string
  householdId: string | null
  system: boolean
  archivedAt?: string | null
}

export type CreateFoodRequest = {
  name: string
  iconKey: FoodIconKey | string
}

export type UpdateFoodRequest = {
  name?: string
  iconKey?: FoodIconKey | string
}
