import { describe, expect, it } from "vitest"

import {
  canConfirmWhy,
  encodeWhyNote,
  WHY_CHIPS_BY_LIKED,
  whyChipsForLiked,
} from "@/components/run/whyChips"

describe("whyChips", () => {
  it("returns liked-specific chip sets", () => {
    expect(whyChipsForLiked("like")).toEqual([...WHY_CHIPS_BY_LIKED.like])
    expect(whyChipsForLiked("no")).toEqual([...WHY_CHIPS_BY_LIKED.no])
    expect(whyChipsForLiked("so_so")).toEqual([...WHY_CHIPS_BY_LIKED.so_so])
    expect(whyChipsForLiked(null)).toEqual([...WHY_CHIPS_BY_LIKED.so_so])
  })

  it("encodeWhyNote returns null when empty", () => {
    expect(encodeWhyNote([], "")).toBeNull()
    expect(encodeWhyNote([], "   ")).toBeNull()
  })

  it("encodeWhyNote joins chips only", () => {
    expect(
      encodeWhyNote(["crunchy", "tasty"], "", WHY_CHIPS_BY_LIKED.like),
    ).toBe("tasty, crunchy")
  })

  it("encodeWhyNote note only", () => {
    expect(encodeWhyNote([], "  crunchy  ")).toBe("crunchy")
  })

  it("encodeWhyNote chips plus note", () => {
    expect(
      encodeWhyNote(
        ["soft", "tasty"],
        "liked the peel",
        WHY_CHIPS_BY_LIKED.like,
      ),
    ).toBe("tasty, soft — liked the peel")
  })

  it("canConfirmWhy requires chip or note", () => {
    expect(canConfirmWhy([], "")).toBe(false)
    expect(canConfirmWhy([], "  ")).toBe(false)
    expect(canConfirmWhy(["tasty"], "")).toBe(true)
    expect(canConfirmWhy([], "yay")).toBe(true)
  })
})
