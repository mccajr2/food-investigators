# Spec stub: ritual-illustrations

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec ritual-illustrations`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Current why-chip and food icons are hard for a young kid to recognize — too
abstract / emoji-like / inconsistent — so parents have to narrate every tap.
We need clearer **realistic cartoon** illustrations (readable at a glance with
text labels still present).

## Non-goals (sketch)

- Changing chip label strings or `whyNote` encoding
- Runtime generative AI in the Run loop (assets can be AI-*assisted* offline)
- Reworking reward mini-game art in the same slice unless it falls out cleanly

## Notes

- Ranked immediately after active `run-survey-shorten` (v1 chip SVGs ship first).
- Likely covers: why-chip art + catalog/food `FoodIcon` heroes (and snack icons
  if in scope).
- Prefer a locked art direction (one illustrator or one AI style guide) so chips
  and foods feel like the same world.
- `/spec` may split into `why-chip-illustrations` vs `food-icon-illustrations` if
  asset volume exceeds one PR.
