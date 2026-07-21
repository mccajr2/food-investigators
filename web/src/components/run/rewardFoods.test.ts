import { describe, expect, it } from "vitest"

import type { SessionResponse } from "@/api/types"
import {
  eligibleRewardFoods,
  initialRewardPhase,
  phaseAfterFoodPick,
  phaseForGame,
  phaseForSurprise,
  rollSurpriseGame,
} from "@/components/run/rewardFoods"

const baseSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "completed",
  foods: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      name: "Apples",
      iconKey: "apple",
      familiarity: "likes",
      variantNote: "Honeycrisp",
      position: 1,
      ateEnough: false,
    },
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "truly_new",
      variantNote: null,
      position: 2,
      ateEnough: false,
    },
  ],
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-15T00:00:00Z",
}

describe("rewardFoods", () => {
  it("encourage when zero ate enough", () => {
    expect(eligibleRewardFoods(baseSession)).toHaveLength(0)
    expect(initialRewardPhase(baseSession)).toEqual({ kind: "encourage" })
  })

  it("pickGame when exactly one ate enough", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        { ...baseSession.foods[0], ateEnough: true },
        { ...baseSession.foods[1], ateEnough: false },
      ],
    }
    const eligible = eligibleRewardFoods(session)
    expect(eligible).toHaveLength(1)
    expect(initialRewardPhase(session)).toEqual({
      kind: "pickGame",
      food: eligible[0],
    })
  })

  it("pick food when two ate enough, then pickGame after food choice", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        { ...baseSession.foods[0], ateEnough: true },
        { ...baseSession.foods[1], ateEnough: true },
      ],
    }
    const phase = initialRewardPhase(session)
    expect(phase.kind).toBe("pick")
    if (phase.kind === "pick") {
      expect(phase.foods.map((food) => food.name)).toEqual([
        "Apples",
        "Strawberries",
      ])
      expect(phaseAfterFoodPick(phase.foods[1])).toEqual({
        kind: "pickGame",
        food: phase.foods[1],
      })
    }
  })

  it("phaseForGame builds catch and cross phases", () => {
    const food = baseSession.foods[0]
    expect(phaseForGame("catch", food)).toEqual({ kind: "catch", food })
    expect(phaseForGame("cross", food)).toEqual({ kind: "cross", food })
  })

  it("rollSurpriseGame picks catch or cross from random", () => {
    expect(rollSurpriseGame(() => 0.1)).toBe("catch")
    expect(rollSurpriseGame(() => 0.9)).toBe("cross")
  })

  it("phaseForSurprise parks on a reveal beat with the rolled game", () => {
    const food = baseSession.foods[0]
    expect(phaseForSurprise(food, () => 0.1)).toEqual({
      kind: "surpriseReveal",
      food,
      game: "catch",
    })
    expect(phaseForSurprise(food, () => 0.9)).toEqual({
      kind: "surpriseReveal",
      food,
      game: "cross",
    })
  })
})
