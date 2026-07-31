# Spec stub: on-demand-food-illustrations

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · re-rank split (from `food-illustrations-ai`)

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec on-demand-food-illustrations` to flesh out Approach, Acceptance Criteria,
and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Non-hero catalog foods and custom household foods still lack kid-clear art.
Parents need **online on-demand AI** generation (cached) for foods outside the
static hero set — without hand-tuning every SVG.

## Non-goals (sketch)

- Why-chip art (`why-chip-illustrations`)
- Offline hero redraws (`hero-food-illustrations`)
- Runtime AI inside the Run why-chip step

## Notes

- Depends on / follows `hero-food-illustrations` so art direction is locked.
- Likely touches OpenAPI / backend (generate + store + serve icon URLs or blobs).
- Confirm provider, caching, cost limits, and custom-food coverage at `/spec`.
