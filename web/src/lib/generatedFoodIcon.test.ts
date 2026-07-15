import { describe, expect, it } from "vitest"

import {
  customIconKeyFromName,
  emojiForFoodName,
  initialsFromName,
  isCustomIconKey,
} from "@/lib/generatedFoodIcon"

describe("generatedFoodIcon", () => {
  it("builds custom icon keys from food names", () => {
    expect(customIconKeyFromName("Cucumber")).toBe("custom_cucumber")
    expect(customIconKeyFromName("  Green Beans! ")).toBe("custom_green_beans")
    expect(isCustomIconKey("custom_cucumber")).toBe(true)
    expect(isCustomIconKey("apple")).toBe(false)
  })

  it("maps common foods including cucumber and french fries", () => {
    expect(emojiForFoodName("Cucumber")).toBe("🥒")
    expect(emojiForFoodName("English cucumber spears")).toBe("🥒")
    expect(emojiForFoodName("French fries")).toBe("🍟")
    expect(emojiForFoodName("crinkle-cut fries")).toBe("🍟")
    expect(emojiForFoodName("Mystery mash")).toBeNull()
    // short keywords must not match inside longer words
    expect(emojiForFoodName("peach")).toBe("🍑")
    expect(emojiForFoodName("pineapple")).toBe("🍍")
  })

  it("falls back to initials for unknown foods", () => {
    expect(initialsFromName("Mystery mash")).toBe("MM")
    expect(initialsFromName("Quinoa")).toBe("QU")
  })
})
