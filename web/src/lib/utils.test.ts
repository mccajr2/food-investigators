import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("web scaffold", () => {
  it("merges tailwind classes via cn()", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})
