# Spec stub: stretch-pathway

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · re-rank split

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec stretch-pathway`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

`stretch-food-targets` ships a parent-nominated destination and C-lite Suggest
bias (prefer path-shaped invents; gate proposing the target itself). Families
still need a **stronger ladder**: durable intermediate steps between current
safes and the destination (e.g. taco-world → ground-beef-adjacent tries),
tracked progress along that path, and stricter “ready for the destination”
rules so Suggest keeps steering in that direction over many nights — not a
one-shot invent toward the name.

## Non-goals (sketch)

- Auto-scheduling nights without Approve (`app-driven-schedule`)
- Clinical treatment plans or therapist instruments
- Replacing parent nomination / Foods CRUD (`stretch-food-targets`)
- Prep rotation for disliked foods (`disliked-prep-rotation`)

## Notes

- Depends on `stretch-food-targets` (queue + brief hooks) shipping first.
- May deepen Gemini/heuristic path reasoning, persist suggested intermediates,
  and/or surface “path to X” progress on Foods or Insights.
- Keep parent-led: Suggest→Approve only.
