# Spec stub: why-insights-surface

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · re-rank split

Thin stub from `/roadmap` split of `why-outcome-depth`. **Not implementable
yet.** Run `/spec why-insights-surface` after capture ships.

## Problem

Even with richer `whyNote` text from chips, Insights never uses why signal.
Parents need dislike/like reasons surfaced as tips or recent snippets so therapy
and pacing decisions aren’t buried only in History rows.

## Non-goals (sketch)

- Replacing History/PDF why display
- Clinical NLP / coding of free text
- Changing Run capture UX (`why-outcome-depth`)

## Notes

- Depends on `why-outcome-depth` (chip-encoded `whyNote`s in completed nights).
- Likely: Insights tip(s) and/or recent why snippets; may touch OpenAPI
  `InsightsResponse`.
