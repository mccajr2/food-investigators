# Spec stub: outing-spot-recommendations

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec outing-spot-recommendations`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

**Parking.** Core tasting ritual + hosted betas first. This is a later
horizontal expansion (travel / eating out stress from the product WHY).

## Problem

Selective eating makes travel and restaurants stressful. Parents planning a
trip or outing may want help finding spots that work for picky eaters (simple
menus, familiar chains, kid-friendly options) grounded in the household’s safe /
liked profile — not a generic Yelp clone.

## Non-goals (sketch)

- Replacing the Plan → Run ritual
- Full meal planning / grocery ordering
- Owning a global restaurant database in v1 (likely Places API + filters)
- Clinical dietary medical advice

## Notes

- Depends on: solid exposure profiles + Insights tastes; hosted prod; privacy
  review for location.
- Likely needs maps/places provider cost controls (quota) — same caution as
  on-demand illustrations.
- Split at `/spec` if “save outing” vs “recommend spots” vs “pack safe foods
  list” become separate PRs.
