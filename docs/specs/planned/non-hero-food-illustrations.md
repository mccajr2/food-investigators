# Spec stub: non-hero-food-illustrations

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-31  
Added: 2026-07-31 · re-rank split (from `on-demand-food-illustrations`)

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec non-hero-food-illustrations` to flesh out Approach, Acceptance Criteria,
and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Sixteen non-hero starter foods still use inline React SVGs while heroes and why
chips are PNG stickers. Plan / Foods / Run feel unfinished until the full starter
catalog matches that picture-book world (and stays iOS-portable).

## Non-goals (sketch)

- Custom / `custom_*` online AI (`on-demand-food-illustrations`)
- Shared object-store / `iconUrl` contract (`food-illustration-object-store`)
- New `iconKey`s, OpenAPI, or backend food schema
- Runtime AI in Run

## Notes

- Same offline concept→pick→lock PNG pipeline as
  `hero-food-illustrations` / `why-chip-sticker-art`.
- Style: [food-icon art brief](../../design/food-icon-art-brief.md); shared cream
  `#F7F2E3`; path likely `web/src/assets/foods/<iconKey>.png`.
- Keys = `FOOD_ICON_KEYS` minus `HERO_FOOD_ICON_KEYS` (16): apple, bagel, toast,
  chicken_nuggets, applesauce, blueberry, grape, pancakes_plain, waffle,
  yogurt_vanilla, carrot, corn, sweet_potato, broccoli, dark_chocolate, spinach.
- Confirm inventory + whether to fold into `heroFoodIcons` vs a sibling map at
  `/spec`.
