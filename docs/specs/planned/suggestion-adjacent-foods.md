# Spec stub: suggestion-adjacent-foods

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · re-rank split

Thin stub from `/roadmap` **re-rank split**. **Not implementable yet.** Run
`/spec suggestion-adjacent-foods` after exposure profiles are real enough to
drive adjacency (and preferably after `familiarity-from-outcomes`).

## Problem

Suggested sessions today shortlist from foods already on the household /
session-eligible list. The product’s usefulness is recommending foods (and
presentations) **reasonably adjacent to safe exposures**, paced to this child’s
progress — including foods **not yet** on the household list. Approve should
bring those into the personal pipeline as new exposure rows (later outcomes can
mark them safe or retrying).

## Non-goals (sketch)

- Science-backed pacing copy / evidence pack (`suggestion-pacing-evidence`)
- Prep rotation for disliked foods (`disliked-prep-rotation`)
- Auto-owned calendar (`app-driven-schedule`)
- Grocery ordering or meal plans

## Notes

- Depends on `household-exposure-profiles` (safe `(food, variant)` set as the
  seed — not food-id-only).
- Open at `/spec`: adjacency corpus = existing system starters only vs a larger
  shared food library vs free-text / AI-proposed names that materialize on
  approve. That choice sets PR size.
- Must stay parent-led: propose → approve; never auto-schedule.
