import type { SessionFoodResponse, SessionResponse } from "@/api/types"

/** Foods marked ate enough — candidates for Catch theme. */
export function eligibleRewardFoods(
  session: SessionResponse,
): SessionFoodResponse[] {
  return [...session.foods]
    .filter((food) => food.ateEnough === true)
    .sort((a, b) => a.position - b.position)
}

export type RewardPhase =
  | { kind: "encourage" }
  | { kind: "pick"; foods: SessionFoodResponse[] }
  | { kind: "catch"; food: SessionFoodResponse }

export function initialRewardPhase(
  session: SessionResponse,
): RewardPhase {
  const eligible = eligibleRewardFoods(session)
  if (eligible.length === 0) {
    return { kind: "encourage" }
  }
  if (eligible.length === 1) {
    return { kind: "catch", food: eligible[0] }
  }
  return { kind: "pick", foods: eligible }
}
