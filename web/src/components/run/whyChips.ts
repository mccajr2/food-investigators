import type { Liked } from "@/api/types"

/** Kid-language why chips by liked outcome (v1 locked copy). */
export const WHY_CHIPS_BY_LIKED = {
  like: [
    "tasty",
    "crunchy",
    "soft",
    "yummy smell",
    "looks good",
    "warm",
    "cold",
  ],
  no: [
    "yucky taste",
    "too crunchy",
    "too soft",
    "yucky smell",
    "looks weird",
    "too hot",
    "too cold",
  ],
  so_so: [
    "kind of tasty",
    "weird texture",
    "okay smell",
    "looks okay",
    "not sure",
  ],
} as const satisfies Record<Liked, readonly string[]>

export function whyChipsForLiked(
  liked?: Liked | null,
): readonly string[] {
  if (liked === "like") {
    return WHY_CHIPS_BY_LIKED.like
  }
  if (liked === "no") {
    return WHY_CHIPS_BY_LIKED.no
  }
  // so_so, or liked skipped — neutral chip set
  return WHY_CHIPS_BY_LIKED.so_so
}

/**
 * Encode selected chips + optional note into whyNote.
 * Chips are joined in `chipOrder` sequence (typically the chip-set order).
 */
export function encodeWhyNote(
  selectedChips: readonly string[],
  note: string,
  chipOrder: readonly string[] = selectedChips,
): string | null {
  const selected = new Set(selectedChips)
  const ordered = chipOrder.filter((chip) => selected.has(chip))
  const chipPart = ordered.join(", ")
  const trimmed = note.trim()
  if (!chipPart && !trimmed) {
    return null
  }
  if (!chipPart) {
    return trimmed
  }
  if (!trimmed) {
    return chipPart
  }
  return `${chipPart} — ${trimmed}`
}

export function canConfirmWhy(
  selectedChips: readonly string[],
  note: string,
): boolean {
  return selectedChips.length > 0 || note.trim().length > 0
}
