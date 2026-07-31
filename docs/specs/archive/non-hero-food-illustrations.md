# Spec: non-hero-food-illustrations

Status: archived  
Created: 2026-07-31  
Completed: 2026-07-31  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-31 · re-rank split (from `on-demand-food-illustrations`)  
Branch: `non-hero-food-illustrations`

## Problem

Sixteen non-hero starter foods still use inline React SVGs while heroes and why
chips are PNG stickers. Plan / Foods / Run feel unfinished until the full starter
catalog matches that picture-book world (and stays iOS-portable).

## Non-goals

- Custom / `custom_*` online AI (`on-demand-food-illustrations`)
- Shared object-store / `iconUrl` contract (`food-illustration-object-store`)
- New `iconKey`s, catalog rows, food renames, or OpenAPI / backend / iOS project
  changes
- Regenerating the ten locked hero PNGs (unless a non-hero sibling forces a
  tiny distinctness fix — default leave heroes alone)
- Runtime AI inside Run
- Changing `generatedFoodIcon` emoji / initials fallbacks

## Approach

**Web-only asset + `FoodIcon` wiring**, same offline pipeline as
`hero-food-illustrations`:

1. Extend [food-icon art brief](../../design/food-icon-art-brief.md) inventory
   with the 16 non-hero keys (style profile already locked — shared cream
   `#F7F2E3`, navy outline, one shine, no ground shadow).
2. Offline AI concepts → parent A/B pick → human polish → commit **static PNG
   masters** (~256×256) under `web/src/assets/foods/<iconKey>.png`.
3. Generalize the static PNG registry in `heroFoodIcons.ts` (or a thin sibling
   imported by it): keep `HERO_FOOD_ICON_KEYS` as the named top-10 subset;
   add `NON_HERO_FOOD_ICON_KEYS` (the 16); `FoodIcon` loads `<img
   className="… rounded-2xl …">` for **any** starter key that has a PNG master.
   Remove the corresponding inline React SVG implementations once mapped.
4. Customs unchanged (`generatedFoodIcon`).

**Non-hero inventory (unchanged keys — redraw only):**

| `iconKey` | Display |
|-----------|---------|
| apple | Apples |
| bagel | Bagel |
| toast | Toast |
| chicken_nuggets | Chicken nuggets |
| applesauce | Applesauce |
| blueberry | Blueberries |
| grape | Grapes |
| pancakes_plain | Plain pancakes |
| waffle | Waffle |
| yogurt_vanilla | Vanilla yogurt |
| carrot | Carrot |
| corn | Corn |
| sweet_potato | Sweet potato |
| broccoli | Broccoli |
| dark_chocolate | Dark chocolate |
| spinach | Spinach |

Pass locked hero (and sibling non-hero) PNGs as style anchors. Distinctness
matters for close pairs (e.g. `pancakes_plain` vs `pancakes_choc_chip`,
`yogurt_vanilla` vs `yogurt_plain`, `bagel` vs `bagel_cream_cheese`,
`chicken_nuggets` vs `chicken_tenders`).

No contract changes. Native clients do not consume these files yet.

## Acceptance criteria

- [x] Every `NON_HERO_FOOD_ICON_KEYS` entry (16) renders from a committed
      `web/src/assets/foods/<iconKey>.png` via `FoodIcon` (static `<img>`, not
      the old inline SVG for that key).
- [x] All ten heroes still render from their existing PNG masters; customs still
      use emoji/initials.
- [x] Art follows the food-icon brief (shared cream, navy outline, one shine, no
      ground shadow); each food is kid-recognizable at tile size without the
      label; close pairs stay visually distinct.
- [x] No new `iconKey`s, OpenAPI, backend, or iOS project changes.
- [x] Tests: each non-hero key has a non-empty PNG + static render; brief lists
      all 16; existing Foods/Run smoke still passes; no leftover inline SVG for
      mapped non-hero keys.

## Tasks

- [x] Docs: extend `docs/design/food-icon-art-brief.md` with the 16 non-hero
      inventory rows + distinctness notes for sibling pairs; keep prompt stem.
- [x] Web: produce human-polished PNG masters for all 16; generalize static PNG
      map; `FoodIcon` loads them with `rounded-2xl`; remove those inline SVGs.
- [x] Tests: non-hero asset coverage + render; brief inventory; heroes + customs
      unchanged; Foods/Run smoke still green.
- [x] Docs: on ship, archive this spec; Next up stays
      `food-illustration-object-store`.

## Open questions

- None — ready for `/implement` after approval.
  (`HERO_FOOD_ICON_KEYS` stays as the top-10 product subset; non-heroes are a
  parallel static list, not renamed into “heroes.”)
