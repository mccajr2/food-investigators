# Spec stub: custom-food-icons

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-20  
Added: 2026-07-20 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec custom-food-icons`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Run choices and food identity still lean on stock emoji / thin icon treatment.
A 5–6 year old (and parent) would recognize foods faster — and enjoy the ritual
more — with a small set of distinctive, on-brand illustrations that feel custom
to Food Investigators rather than default emoji.

## Non-goals (sketch)

- AI-generated novel art per food (`ai-game-variants`)
- Full illustration pack for every future custom food on day one
- Replacing the whole app chrome (`kid-run-ui` owns atmosphere)
- Photoreal food photos

## Notes

- Prefer hand-tuned SVG / asset set for starters + run option symbols.
- Align with existing `FoodIcon` / `iconKey` pipeline where possible.
- Pairs well after or alongside `kid-run-ui`.
