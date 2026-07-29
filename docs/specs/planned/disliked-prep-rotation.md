# Spec stub: disliked-prep-rotation

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-28  
Added: 2026-07-28 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec disliked-prep-rotation`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

A dislike often means “this prep,” not “this food forever.” The app should
intelligently suggest a few **different preparations** of a disliked food over
weeks (via variant notes / familiarity), then give that food a longer rest if
none hit — without nagging or stacking truly-new every night.

## Non-goals (sketch)

- Science citation library (`suggestion-pacing-evidence`)
- Auto-creating sessions without Approve
- Recipe database / grocery lists

## Notes

- Builds on `suggested-next-session` shortlist + `variantNote` / same-food rules.
- Ranked after `suggestion-pacing-evidence` so calm pacing language can inform rests.
- Exact “3 preps / N weeks / rest M weeks” knobs locked in `/spec`.
