import { describe, expect, it } from "vitest"

import {
  activeChildDisplayName,
  ateEnoughPrompt,
  encourageBody,
  encourageHeadline,
  planEmptyHint,
  planSectionBlurb,
  tastingNightLabel,
  withChildName,
} from "@/lib/childDisplayName"

describe("childDisplayName copy helpers", () => {
  it("treats blank and whitespace as unset", () => {
    expect(activeChildDisplayName(null)).toBeNull()
    expect(activeChildDisplayName(undefined)).toBeNull()
    expect(activeChildDisplayName("   ")).toBeNull()
    expect(activeChildDisplayName("  Alex  ")).toBe("Alex")
  })

  it("formats tasting night and plan copy with a name", () => {
    expect(tastingNightLabel("Alex")).toBe("Alex's tasting night")
    expect(tastingNightLabel(null)).toBe("Tasting night")
    expect(tastingNightLabel("James")).toBe("James' tasting night")
    expect(planSectionBlurb("Alex")).toMatch(/Alex's tasting nights/)
    expect(planSectionBlurb(null)).toMatch(/^Schedule tasting nights/)
    expect(planEmptyHint("Alex")).toBe(
      "No planned nights for Alex yet. Plan one to get started.",
    )
    expect(planEmptyHint(null)).toBe(
      "No planned nights yet. Plan one to get started.",
    )
  })

  it("personalizes run ate-enough and encourage surfaces", () => {
    expect(ateEnoughPrompt("Alex")).toBe("Did Alex eat enough?")
    expect(ateEnoughPrompt(null)).toBe("Did they eat enough?")
    expect(encourageHeadline("habit", "Alex")).toBe("Nice night, Alex")
    expect(encourageHeadline("tryAgain", null)).toBe("Nice try tonight")
    expect(encourageBody("habit", "Alex")).toMatch(/Alex's habit/)
    expect(encourageBody("tryAgain", "Alex")).toMatch(/hard for Alex/)
    expect(encourageBody("habit", null)).toMatch(/keeps the habit going/)
  })

  it("routes through withChildName", () => {
    expect(withChildName("Sam", (n) => `Hi ${n}`, "Hi")).toBe("Hi Sam")
    expect(withChildName("  ", (n) => `Hi ${n}`, "Hi")).toBe("Hi")
  })
})
