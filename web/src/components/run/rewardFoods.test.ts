import { describe, expect, it } from "vitest"

import type { SessionResponse } from "@/api/types"
import {
  eligibleRewardFoods,
  initialRewardPhase,
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

  it("catch when exactly one ate enough", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        { ...baseSession.foods[0], ateEnough: true },
        { ...baseSession.foods[1], ateEnough: false },
      ],
    }
    const eligible = eligibleRewardFoods(session)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].name).toBe("Apples")
    expect(initialRewardPhase(session)).toEqual({
      kind: "catch",
      food: eligible[0],
    })
  })

  it("pick when two ate enough", () => {
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
    }
  })
})
