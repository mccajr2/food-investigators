/**
 * Active child display name for parent-facing copy.
 * Indirection-friendly: today this is the household's single optional name;
 * multi-child later can swap the source without rewriting every screen.
 */

export function activeChildDisplayName(
  name: string | null | undefined,
): string | null {
  const trimmed = name?.trim()
  return trimmed ? trimmed : null
}

export function withChildName(
  name: string | null | undefined,
  whenNamed: (displayName: string) => string,
  whenGeneric: string,
): string {
  const display = activeChildDisplayName(name)
  return display ? whenNamed(display) : whenGeneric
}

/** e.g. "Alex's tasting night" vs "Tasting night". */
export function tastingNightLabel(name: string | null | undefined): string {
  return withChildName(
    name,
    (display) => `${possessive(display)} tasting night`,
    "Tasting night",
  )
}

export function planSectionBlurb(name: string | null | undefined): string {
  return withChildName(
    name,
    (display) =>
      `Schedule ${possessive(display)} tasting nights with two foods and how familiar each is.`,
    "Schedule tasting nights with two foods and how familiar each is.",
  )
}

export function planEmptyHint(name: string | null | undefined): string {
  return withChildName(
    name,
    (display) => `No planned nights for ${display} yet. Plan one to get started.`,
    "No planned nights yet. Plan one to get started.",
  )
}

export function ateEnoughPrompt(name: string | null | undefined): string {
  return withChildName(
    name,
    (display) => `Did ${display} eat enough?`,
    "Did they eat enough?",
  )
}

export function encourageHeadline(
  tone: "habit" | "tryAgain",
  name: string | null | undefined,
): string {
  if (tone === "habit") {
    return withChildName(name, (display) => `Nice night, ${display}`, "Nice night")
  }
  return withChildName(
    name,
    (display) => `Nice try tonight, ${display}`,
    "Nice try tonight",
  )
}

export function encourageBody(
  tone: "habit" | "tryAgain",
  name: string | null | undefined,
): string {
  if (tone === "habit") {
    return withChildName(
      name,
      (display) =>
        `Showing up for tasting keeps ${possessive(display)} habit going. See you next time.`,
      "Showing up for tasting keeps the habit going. See you next time.",
    )
  }
  return withChildName(
    name,
    (display) =>
      `Eating enough can be hard for ${display}. You can try again another night — we will be ready with a game when you do.`,
    "Eating enough can be hard. You can try again another night — we will be ready with a game when you do.",
  )
}

function possessive(displayName: string): string {
  return displayName.endsWith("s") || displayName.endsWith("S")
    ? `${displayName}'`
    : `${displayName}'s`
}
