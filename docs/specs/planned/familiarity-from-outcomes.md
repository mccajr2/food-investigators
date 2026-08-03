# Spec stub: familiarity-from-outcomes

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · re-rank split

Thin stub from `/roadmap` **re-rank split** of the familiarity product path.
**Not implementable yet.** Run `/spec familiarity-from-outcomes` after
`household-exposure-profiles` (and ideally after some signup bootstrap use).

## Problem

Safe presentations should usually stay safe, but the designed path is: recommend
adjacent tries → hope they become new safes; if a **food + variant** is tried
and does not land, it should enter the personal pipeline as **retrying** (not
vanish or stay forever “truly new”). Completing a run should upsert the matching
**exposure profile** from the session slot — without taking judgment away from
the parent.

## Non-goals (sketch)

- Manual Foods / Plan autofill persist model (`household-exposure-profiles`)
- Signup bootstrap (`signup-safe-foods`)
- Changing reward unlock rules beyond what familiarity already implies
- Clinical scoring or forced promotion to safe

## Notes

- Parent override (especially clearing safe) must remain possible.
- Keep rules calm and explainable; prefer conservative auto-promotions.
- Key = `(foodId, normalized variantNote)` from the completed slot.
- Feeds `suggestion-adjacent-foods` and `suggestion-pacing-evidence` with a
  real tried/retry signal.
