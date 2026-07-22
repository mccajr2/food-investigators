import { afterEach, describe, expect, it } from "vitest"

import {
  bestScoreKey,
  readBest,
  recordScore,
} from "@/components/run/rewardBestScores"

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null
    },
    key() {
      return null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

describe("rewardBestScores", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("scopes keys by game and household (or local fallback)", () => {
    expect(bestScoreKey("catch")).toBe("fi.reward.best.catch.local")
    expect(bestScoreKey("cross", "  hh-1  ")).toBe(
      "fi.reward.best.cross.hh-1",
    )
    expect(bestScoreKey("catch", "")).toBe("fi.reward.best.catch.local")
    expect(bestScoreKey("catch", null)).toBe("fi.reward.best.catch.local")
  })

  it("reads 0 when nothing is stored", () => {
    const storage = memoryStorage()
    expect(readBest("catch", null, storage)).toBe(0)
  })

  it("records a first positive score as a new best", () => {
    const storage = memoryStorage()
    const result = recordScore("catch", 4, "hh-1", storage)
    expect(result).toEqual({ best: 4, isNewBest: true })
    expect(readBest("catch", "hh-1", storage)).toBe(4)
  })

  it("does not celebrate or overwrite when score does not beat best", () => {
    const storage = memoryStorage({
      [bestScoreKey("cross", "hh-1")]: "7",
    })
    const result = recordScore("cross", 5, "hh-1", storage)
    expect(result).toEqual({ best: 7, isNewBest: false })
    expect(readBest("cross", "hh-1", storage)).toBe(7)
  })

  it("celebrates only when new best is at least 1 and strictly greater", () => {
    const storage = memoryStorage()
    expect(recordScore("catch", 0, null, storage)).toEqual({
      best: 0,
      isNewBest: false,
    })
    expect(recordScore("catch", 1, null, storage)).toEqual({
      best: 1,
      isNewBest: true,
    })
    // Strict Mode double-invoke with the same score must not re-celebrate.
    expect(recordScore("catch", 1, null, storage)).toEqual({
      best: 1,
      isNewBest: false,
    })
  })

  it("keeps Catch and Cross bests independent", () => {
    const storage = memoryStorage()
    recordScore("catch", 3, "hh", storage)
    recordScore("cross", 9, "hh", storage)
    expect(readBest("catch", "hh", storage)).toBe(3)
    expect(readBest("cross", "hh", storage)).toBe(9)
  })

  it("keeps households independent on the same device", () => {
    const storage = memoryStorage()
    recordScore("catch", 2, "a", storage)
    recordScore("catch", 8, "b", storage)
    expect(readBest("catch", "a", storage)).toBe(2)
    expect(readBest("catch", "b", storage)).toBe(8)
  })
})
