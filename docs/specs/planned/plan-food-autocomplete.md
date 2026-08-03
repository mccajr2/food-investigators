# Spec stub: plan-food-autocomplete

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec plan-food-autocomplete` to flesh out Approach, Acceptance Criteria, and
Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap`
**split** (`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Plan session food pickers use a long native `<select>`. With ~26 system starters
plus household tasting foods, the list is already hard to scan; signup intake
and customs will make it worse. Parents need a typeahead text filter with a
filtered dropdown of matching foods — not an unbounded combobox of every
option.

## Non-goals (sketch)

- Changing Plan create/update API or OpenAPI food ids
- Server-side search / pagination (client filter of the already-loaded list is
  enough for beta catalog sizes)
- Autocomplete on Foods create, Suggest draft pickers, or native iOS (web Plan
  first unless `/spec` expands)
- Creating new foods from the Plan picker (stay pick-existing)

## Notes

- Today: `FoodSlotFields` in `web/src/components/plan/PlanPage.tsx` uses
  `<select>` over `sessionEligible` foods.
- Prefer accessible combobox pattern (input + filtered listbox) over dumping
  every food in an open list.
- Ranked after `signup-safe-foods` so safe bootstrap can land first; promote to
  Next up if Plan UX pain blocks beta before signup ships.
