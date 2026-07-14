# Spec stub: food-catalog

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-11  
Added: 2026-07-11 · initial

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec food-catalog`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Sessions need named foods with large, simple icons. Parents should start from a
small library of common kid foods and add their own over time.

## Non-goals (sketch)

- Nutrition facts, recipes, or grocery integration
- AI-generated icons for v1 (pick from a fixed icon set is fine)
- Per-food familiarity history UI (that lands with sessions / insights)

## Notes

- Depends on `family-account` for household-scoped custom foods.
- Icons must work at “learning to read” size on iPad later.
