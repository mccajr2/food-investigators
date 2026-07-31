import { describe, expect, it } from "vitest"

import type { SessionResponse } from "@/api/types"
import {
  eligibleRewardFoods,
  encourageTone,
  gameLabel,
  initialRewardPhase,
  phaseAfterFoodPick,
  phaseForGame,
  phaseForSurprise,
  previousRewardPhase,
  REWARD_GAME_KINDS,
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
      familiarity: "safe",
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
    expect(encourageTone(baseSession)).toBe("tryAgain")
    expect(initialRewardPhase(baseSession)).toEqual({
      kind: "encourage",
      tone: "tryAgain",
    })
  })

  it("encourage when both foods are safe regardless of ate-enough", () => {
    const bothSafe = (
      ateFirst: boolean,
      ateSecond: boolean,
    ): SessionResponse => ({
      ...baseSession,
      foods: [
        {
          ...baseSession.foods[0],
          familiarity: "safe",
          ateEnough: ateFirst,
        },
        {
          ...baseSession.foods[1],
          familiarity: "safe",
          ateEnough: ateSecond,
        },
      ],
    })

    expect(initialRewardPhase(bothSafe(false, false))).toEqual({
      kind: "encourage",
      tone: "tryAgain",
    })
    for (const session of [
      bothSafe(true, false),
      bothSafe(false, true),
      bothSafe(true, true),
    ]) {
      expect(eligibleRewardFoods(session)).toHaveLength(0)
      expect(encourageTone(session)).toBe("habit")
      expect(initialRewardPhase(session)).toEqual({
        kind: "encourage",
        tone: "habit",
      })
    }
  })

  it("mixed night: habit encourage when only the safe food ate enough", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        { ...baseSession.foods[0], ateEnough: true },
        { ...baseSession.foods[1], ateEnough: false },
      ],
    }
    expect(eligibleRewardFoods(session)).toHaveLength(0)
    expect(initialRewardPhase(session)).toEqual({
      kind: "encourage",
      tone: "habit",
    })
  })

  it("mixed night: pickGame themed on stretch when only stretch ate enough", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        { ...baseSession.foods[0], ateEnough: false },
        { ...baseSession.foods[1], ateEnough: true },
      ],
    }
    const eligible = eligibleRewardFoods(session)
    expect(eligible).toHaveLength(1)
    expect(eligible[0]?.familiarity).toBe("truly_new")
    expect(initialRewardPhase(session)).toEqual({
      kind: "pickGame",
      food: eligible[0],
    })
  })

  it("two stretch foods: pickGame when only one ate enough", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        {
          ...baseSession.foods[0],
          familiarity: "familiar_but_new",
          ateEnough: false,
        },
        {
          ...baseSession.foods[1],
          familiarity: "retrying",
          ateEnough: true,
        },
      ],
    }
    const eligible = eligibleRewardFoods(session)
    expect(eligible).toHaveLength(1)
    expect(initialRewardPhase(session)).toEqual({
      kind: "pickGame",
      food: eligible[0],
    })
  })

  it("two stretch foods: pick when both ate enough, then pickGame after food choice", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        {
          ...baseSession.foods[0],
          familiarity: "retrying",
          ateEnough: true,
        },
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

  it("familiar_but_new and retrying count as stretch (not safe)", () => {
    const session: SessionResponse = {
      ...baseSession,
      foods: [
        {
          ...baseSession.foods[0],
          familiarity: "familiar_but_new",
          ateEnough: true,
        },
        {
          ...baseSession.foods[1],
          familiarity: "retrying",
          ateEnough: false,
        },
      ],
    }
    expect(eligibleRewardFoods(session)).toHaveLength(1)
    expect(eligibleRewardFoods(session)[0]?.familiarity).toBe(
      "familiar_but_new",
    )
  })

  it("phaseForGame builds catch, cross, and match phases", () => {
    const food = baseSession.foods[0]
    expect(phaseForGame("catch", food)).toEqual({ kind: "catch", food })
    expect(phaseForGame("cross", food)).toEqual({ kind: "cross", food })
    expect(phaseForGame("match", food)).toEqual({ kind: "match", food })
  })

  it("gameLabel names all three templates", () => {
    expect(gameLabel("catch")).toBe("Catch")
    expect(gameLabel("cross")).toBe("Cross")
    expect(gameLabel("match")).toBe("Match")
  })

  it("rollSurpriseGame picks catch, cross, or match with equal bands", () => {
    expect(REWARD_GAME_KINDS).toEqual(["catch", "cross", "match"])
    expect(rollSurpriseGame(() => 0)).toBe("catch")
    expect(rollSurpriseGame(() => 0.3)).toBe("catch")
    expect(rollSurpriseGame(() => 1 / 3)).toBe("cross")
    expect(rollSurpriseGame(() => 0.5)).toBe("cross")
    expect(rollSurpriseGame(() => 2 / 3)).toBe("match")
    expect(rollSurpriseGame(() => 0.99)).toBe("match")
  })

  it("phaseForSurprise parks on a reveal beat with the rolled game", () => {
    const food = baseSession.foods[0]
    expect(phaseForSurprise(food, () => 0)).toEqual({
      kind: "surpriseReveal",
      food,
      game: "catch",
    })
    expect(phaseForSurprise(food, () => 0.5)).toEqual({
      kind: "surpriseReveal",
      food,
      game: "cross",
    })
    expect(phaseForSurprise(food, () => 0.9)).toEqual({
      kind: "surpriseReveal",
      food,
      game: "match",
    })
  })

  it("previousRewardPhase walks which-game back to food pick when multi eligible", () => {
    const foods = [
      {
        ...baseSession.foods[0],
        familiarity: "truly_new" as const,
        ateEnough: true,
      },
      {
        ...baseSession.foods[1],
        familiarity: "familiar_but_new" as const,
        ateEnough: true,
      },
    ]
    expect(
      previousRewardPhase({ kind: "pickGame", food: foods[0] }, foods),
    ).toEqual({ kind: "pick", foods })
    expect(previousRewardPhase({ kind: "pick", foods }, foods)).toBeNull()
    expect(
      previousRewardPhase(
        { kind: "surpriseReveal", food: foods[0], game: "catch" },
        foods,
      ),
    ).toEqual({ kind: "pickGame", food: foods[0] })
    expect(
      previousRewardPhase({ kind: "catch", food: foods[0] }, foods),
    ).toBeNull()
  })

  it("previousRewardPhase disables Back when which-game is the first reward screen", () => {
    const food = {
      ...baseSession.foods[1],
      familiarity: "truly_new" as const,
      ateEnough: true,
    }
    expect(previousRewardPhase({ kind: "pickGame", food }, [food])).toBeNull()
  })
})
