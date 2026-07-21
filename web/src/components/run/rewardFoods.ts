import type { SessionFoodResponse, SessionResponse } from "@/api/types"

/** Foods marked ate enough — candidates for reward game theme. */
export function eligibleRewardFoods(
  session: SessionResponse,
): SessionFoodResponse[] {
  return [...session.foods]
    .filter((food) => food.ateEnough === true)
    .sort((a, b) => a.position - b.position)
}

export type RewardGameKind = "catch" | "cross"

export type RewardPhase =
  | { kind: "encourage" }
  | { kind: "pick"; foods: SessionFoodResponse[] }
  | { kind: "pickGame"; food: SessionFoodResponse }
  | {
      kind: "surpriseReveal"
      food: SessionFoodResponse
      game: RewardGameKind
    }
  | { kind: "catch"; food: SessionFoodResponse }
  | { kind: "cross"; food: SessionFoodResponse }

export function initialRewardPhase(session: SessionResponse): RewardPhase {
  const eligible = eligibleRewardFoods(session)
  if (eligible.length === 0) {
    return { kind: "encourage" }
  }
  if (eligible.length === 1) {
    return { kind: "pickGame", food: eligible[0] }
  }
  return { kind: "pick", foods: eligible }
}

export function phaseAfterFoodPick(food: SessionFoodResponse): RewardPhase {
  return { kind: "pickGame", food }
}

export function phaseForGame(
  game: RewardGameKind,
  food: SessionFoodResponse,
): RewardPhase {
  return game === "catch"
    ? { kind: "catch", food }
    : { kind: "cross", food }
}

/** Equal chance Catch or Cross — inject `random` in tests. */
export function rollSurpriseGame(
  random: () => number = Math.random,
): RewardGameKind {
  return random() < 0.5 ? "catch" : "cross"
}

/** Roll then park on the reveal beat before play. */
export function phaseForSurprise(
  food: SessionFoodResponse,
  random: () => number = Math.random,
): RewardPhase {
  return {
    kind: "surpriseReveal",
    food,
    game: rollSurpriseGame(random),
  }
}

export function gameLabel(game: RewardGameKind): string {
  return game === "catch" ? "Catch" : "Cross"
}

/** How long the “Surprise: …” beat stays up before play starts. */
export const SURPRISE_REVEAL_MS = 1_400
