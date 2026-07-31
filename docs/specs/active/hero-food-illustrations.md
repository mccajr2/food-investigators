# Spec: hero-food-illustrations

Status: active  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-30 · re-rank split (from `food-illustrations-ai`)  
Branch: `hero-food-illustrations`

## Problem

Hero `FoodIcon` art is hard for a young kid to recognize next to the clearer
why-chip cartoons. Run / Plan / Foods should feel like one picture-book world.
Heroes were also committed as React-only SVG components, which are awkward to
reuse when native iOS lands — even though the Apple developer account is deferred
for the PoC.

## Non-goals

- Why-chip art changes or migrating why chips to static files (optional later;
  leave React SVGs as shipped)
- Online on-demand AI for non-hero / custom foods (`on-demand-food-illustrations`)
- Redrawing all ~26 starter `FOOD_ICON_KEYS` (non-heroes keep today’s inline SVGs)
- New `iconKey`s, catalog rows, or food renames
- OpenAPI / backend / Insights / reward game symbol changes
- Paying for / shipping native iOS assets in this PR (files should still be
  *portable* for a later asset-catalog drop-in)
- Runtime AI inside Run
- Custom-food emoji / initials fallbacks (`generatedFoodIcon`)

## Approach

**Web-only asset + `FoodIcon` wiring.** Offline AI-assisted art, then
**human-polished** before commit:

1. Generate concepts (prefer raster sketches OK).
2. Human pick / simplify / brand-fit / crop to 64×64-readable silhouettes.
3. Commit **static SVG files** (one per hero `iconKey`) under e.g.
   `web/src/assets/foods/<iconKey>.svg`.
4. Thin `FoodIcon` path: hero keys load the static file; non-hero starters keep
   existing inline components; custom keys unchanged.

Lock a short [food-icon art brief](../../design/food-icon-art-brief.md) that
matches the why-chip world (palette, line weight, no text in art, readable at
~40–56px) — food identity must be kid-obvious without reading the label.

**Hero list (unchanged keys — redraw only):**

| `iconKey` | Display |
|-----------|---------|
| strawberry | Strawberries |
| banana | Banana |
| ramen | Instant ramen |
| bagel_cream_cheese | Bagel and cream cheese |
| yogurt_plain | Plain yogurt |
| pancakes_choc_chip | Chocolate chip pancakes |
| cheese_pizza | Cheese pizza |
| soft_pretzel | Soft pretzels |
| chicken_tenders | Chicken tenders |
| raspberry | Raspberries |

No contract changes. Native clients do not consume these files yet.

## Acceptance criteria

- [ ] Every `HERO_FOOD_ICON_KEYS` entry renders from a committed static SVG file
      (not the old inline hero component paths).
- [ ] Non-hero starter keys and custom-food fallbacks behave as today.
- [ ] Art shares one locked food-icon brief aligned with why-chip palette /
      picture-book style; no emoji / photoreal / purple-glow drift.
- [ ] At chip/tile size, a 5–6 year old can recognize each hero food without
      relying on the text label (spot-check in review; tests assert file + render).
- [ ] No new `iconKey`s, OpenAPI, backend, or iOS project changes.
- [ ] Tests: each hero key resolves to a non-empty asset and renders in
      `FoodIcon`; existing Foods/Run smoke that shows a hero icon still passes;
      art brief lists all ten hero keys.

## Tasks

- [ ] Docs: add `docs/design/food-icon-art-brief.md` (style, palette, size,
      offline prompt stem, human-polish checklist).
- [ ] Web: produce human-polished static SVGs for all 10 heroes; map in
      `FoodIcon` (remove inline hero implementations once mapped).
- [ ] Web: keep non-hero inline icons + `generatedFoodIcon` path unchanged.
- [ ] Tests: hero asset coverage + `FoodIcon` render; brief lists every hero key.
- [ ] Docs: on ship, archive this spec; Next up stays
      `on-demand-food-illustrations` (or re-rank if needed).

## Open questions

- None — ready for `/implement` after approval.
  (Optional later: migrate why chips to static SVGs for iOS parity — not this PR.)
