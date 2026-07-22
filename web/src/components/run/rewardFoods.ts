import type { SessionFoodResponse, SessionResponse } from "@/api/types"

/** Foods marked ate enough — candidates for reward game theme. */
export function eligibleRewardFoods(
  session: SessionResponse,
): SessionFoodResponse[] {
  return [...session.foods]
    .filter((food) => food.ateEnough === true)
    .sort((a, b) => a.position - b.position)
}

export type RewardGameKind = "catch" | "cross" | "match"

export const REWARD_GAME_KINDS: readonly RewardGameKind[] = [
  "catch",
  "cross",
  "match",
] as const

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
  | { kind: "match"; food: SessionFoodResponse }

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
  if (game === "catch") {
    return { kind: "catch", food }
  }
  if (game === "cross") {
    return { kind: "cross", food }
  }
  return { kind: "match", food }
}

/** Equal chance Catch, Cross, or Match — inject `random` in tests. */
export function rollSurpriseGame(
  random: () => number = Math.random,
): RewardGameKind {
  const index = Math.min(
    REWARD_GAME_KINDS.length - 1,
    Math.floor(random() * REWARD_GAME_KINDS.length),
  )
  return REWARD_GAME_KINDS[index] ?? "catch"
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
  if (game === "catch") {
    return "Catch"
  }
  if (game === "cross") {
    return "Cross"
  }
  return "Match"
}

/** How long the “Surprise: …” beat stays up before play starts. */
export const SURPRISE_REVEAL_MS = 1_400
