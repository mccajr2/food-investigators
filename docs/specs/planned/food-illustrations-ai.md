# Spec stub: food-illustrations-ai

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · re-rank split (from `ritual-illustrations`)

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec food-illustrations-ai`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Catalog / hero `FoodIcon` art is hard for a young kid to recognize, and keeping
hand-tuned SVGs for every food does not scale. Parents need clearer food art,
including **on-demand AI** for foods that are not in a small hero set.

## Non-goals (sketch)

- Why-chip art (`why-chip-illustrations`)
- Changing food names / catalog identity rules in the same slice unless required
  for icon keys
- Runtime AI inside the Run why-chip step

## Notes

- Ranked immediately after `why-chip-illustrations`.
- Expected shape: hero foods first (curated) + online on-demand AI for the rest of
  the catalog (and custom foods as needed). `/spec` may split
  `hero-food-illustrations` vs `on-demand-food-illustrations` if volume or API
  work exceeds one PR.
- Likely touches OpenAPI / backend if generation is server-side — confirm at
  `/spec` time.
- Match art direction to why-chip cartoons so Run feels like one world.
