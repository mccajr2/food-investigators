# Spec stub: on-demand-food-illustrations

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · re-rank split (from `food-illustrations-ai`) · narrowed
2026-07-31 · re-rank split (customs only; store + non-heroes carved out)

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec on-demand-food-illustrations` to flesh out Approach, Acceptance Criteria,
and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Custom household foods (`custom_*`) still fall back to emoji/initials. Parents
need **online on-demand AI** generation into the **shared** illustration store so
kid-clear sticker art appears without hand-tuning every food — and so another
household naming the same food can reuse an existing image.

## Non-goals (sketch)

- Offline starter / hero PNG redraws (`non-hero-food-illustrations`,
  `hero-food-illustrations`)
- Building the shared object-store + `iconUrl` contract
  (`food-illustration-object-store` — prerequisite)
- Why-chip art; runtime AI inside the Run why-chip step
- Regenerating locked hero / non-hero static masters

## Notes

- Depends on `food-illustration-object-store` (shared reuse) and art direction in
  [food-icon art brief](../../design/food-icon-art-brief.md).
- Scope = **customs only**; skip keys that already have static masters.
- Confirm provider (image model), rate/cost limits, cache key (normalized name /
  slug), and graceful emoji fallback when unconfigured / failed — at `/spec`.
