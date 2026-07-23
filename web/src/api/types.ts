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
  "cheese_pizza",
  "soft_pretzel",
  "raspberry",
] as const

export type FoodIconKey = (typeof FOOD_ICON_KEYS)[number]

export type FoodResponse = {
  id: string
  name: string
  iconKey: FoodIconKey | string
  householdId: string | null
  system: boolean
  sessionEligible: boolean
  liked?: Liked | null
  texture?: Texture | null
  tasteNote?: string | null
  archivedAt?: string | null
}

export type CreateFoodRequest = {
  name: string
  iconKey: FoodIconKey | string
  sessionEligible?: boolean
  liked?: Liked | null
  texture?: Texture | null
  tasteNote?: string | null
}

export type UpdateFoodRequest = {
  name?: string
  iconKey?: FoodIconKey | string
  sessionEligible?: boolean
  liked?: Liked | null
  texture?: Texture | null
  tasteNote?: string | null
}

export type Familiarity = "likes" | "familiar_but_new" | "truly_new"

export type SessionStatus = "planned" | "cancelled" | "completed"

export type Liked = "like" | "so_so" | "no"

export type Texture = "soft" | "crunchy" | "chewy" | "wet"

export type Temperature = "cold" | "warm" | "hot"

export type Smell = "like" | "so_so" | "no"

export type SessionFoodRequest = {
  foodId: string
  familiarity: Familiarity
  /** Brand/variety/prep note — required + distinct when both slots share foodId. */
  variantNote?: string | null
}

/** Mirrors CreateSessionRequest — scheduledOn must be today+; one planned/completed per day. */
export type CreateSessionRequest = {
  scheduledOn: string
  foods: [SessionFoodRequest, SessionFoodRequest]
}

export type UpdateSessionRequest = {
  scheduledOn: string
  foods: [SessionFoodRequest, SessionFoodRequest]
}

export type FoodOutcomeRequest = {
  position: 1 | 2
  liked?: Liked | null
  texture?: Texture | null
  temperature?: Temperature | null
  smell?: Smell | null
  whyNote?: string | null
  changeNote?: string | null
  ateEnough: boolean
}

export type CompleteSessionRequest = {
  foods: [FoodOutcomeRequest, FoodOutcomeRequest]
}

export type UpdateParentNoteRequest = {
  parentNote: string | null
}

export type SessionFoodResponse = {
  foodId: string
  name: string
  iconKey: FoodIconKey | string
  familiarity: Familiarity
  variantNote?: string | null
  position: 1 | 2
  liked?: Liked | null
  texture?: Texture | null
  temperature?: Temperature | null
  smell?: Smell | null
  whyNote?: string | null
  changeNote?: string | null
  ateEnough?: boolean | null
}

export type SessionResponse = {
  id: string
  scheduledOn: string
  status: SessionStatus
  foods: SessionFoodResponse[]
  parentNote?: string | null
  createdAt: string
  updatedAt: string
}

export type InsightTip = {
  id: string
  message: string
}

export type InsightsResponse = {
  completedSessionCount: number
  ready: boolean
  ateEnoughYes: number
  ateEnoughNo: number
  likedLike: number
  likedSoSo: number
  likedNo: number
  likedSkipped: number
  topLikedTextures: Texture[]
  familiarityLikes: number
  familiarityFamiliarButNew: number
  familiarityTrulyNew: number
  snackCount: number
  hasParentNotes: boolean
  tips: InsightTip[]
}
