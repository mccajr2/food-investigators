/** Local personal-best storage for Catch / Cross / Match reward games. */

export type RewardScoreGame = "catch" | "cross" | "match"

export type RecordScoreResult = {
  best: number
  isNewBest: boolean
}

const KEY_PREFIX = "fi.reward.best"

/** Storage key: per game, household-scoped when id is present. */
export function bestScoreKey(
  game: RewardScoreGame,
  householdId?: string | null,
): string {
  const scope =
    typeof householdId === "string" && householdId.trim().length > 0
      ? householdId.trim()
      : "local"
  return `${KEY_PREFIX}.${game}.${scope}`
}

function parseBest(raw: string | null): number {
  if (raw === null || raw === "") {
    return 0
  }
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }
  return value
}

export function readBest(
  game: RewardScoreGame,
  householdId?: string | null,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): number {
  try {
    return parseBest(storage.getItem(bestScoreKey(game, householdId)))
  } catch {
    return 0
  }
}

/**
 * Persist score if it beats the stored best.
 * `isNewBest` is true only when the new best is ≥ 1 and strictly greater than
 * the previous stored value (Strict Mode double-invoke safe).
 */
export function recordScore(
  game: RewardScoreGame,
  score: number,
  householdId?: string | null,
  storage: Pick<Storage, "getItem" | "setItem"> = globalThis.localStorage,
): RecordScoreResult {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0
  const previous = readBest(game, householdId, storage)
  if (safeScore > previous) {
    const isNewBest = safeScore >= 1
    try {
      storage.setItem(bestScoreKey(game, householdId), String(safeScore))
    } catch {
      // Quota / private mode — still report the in-memory outcome for this round.
    }
    return { best: safeScore, isNewBest }
  }
  return { best: previous, isNewBest: false }
}
