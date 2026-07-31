# Spec: why-chip-sticker-art

Status: archived  
Created: 2026-07-31  
Completed: 2026-07-31  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-31 · enhancement  
Branch: `why-chip-sticker-art`

## Problem

Why-chip icons shipped as React SVGs in `why-chip-illustrations`. Hero foods
later locked a stronger kid-clear **PNG sticker** pipeline (shared cream ground,
navy outline, brand shine, concept→pick→lock). Chips now look behind the heroes
on the same Run placemat — they need the same treatment so the ritual feels like
one world (and stays iOS-portable).

## Non-goals

- Changing chip label strings, like/no/so_so sets, or `whyNote` encoding
- Hero food art changes (`hero-food-illustrations` — already shipped)
- Online on-demand generation (`on-demand-food-illustrations`)
- Runtime AI inside Run
- OpenAPI / backend / mobile native asset catalogs in this PR (PNGs must still
  be *portable* for a later iOS drop-in)
- New chip labels or a third so-so-only art style (so_so keeps reusing like∪no)
- Reward-game symbols or non-why UI chrome

## Approach

**Web-only asset + `WhyChipIcon` wiring**, same pipeline as heroes:

1. Update [why-chip art brief](../../design/why-chip-art-brief.md) so its style
   profile matches [food-icon art brief](../../design/food-icon-art-brief.md):
   picture-book sticker, thick navy `#153160` outline, one brand shine, **no**
   ground shadow, sparse detail, **flat shared cream `#F7F2E3` for every chip**
   (no polarity-tinted tile grounds). Keep sense motifs + like/no polarity cues
   (lime smile vs coral frown / “too much”) from the existing inventory tables.
2. Offline AI concepts → parent A/B pick → human polish → commit **static PNG
   masters** (~256×256) under `web/src/assets/why-chips/<slug>.png`.
3. Slug = label with spaces → `_` (e.g. `yummy smell` → `yummy_smell.png`). Map
   label → URL in a thin module (mirror `heroFoodIcons.ts`).
4. `WhyChipIcon` renders heroes-style `<img className="… rounded-2xl …">` for
   every unique label; remove inline React SVG implementations once mapped.
5. Unique assets = **like ∪ no** (14). `so_so` reuses those same files by label
   — no middling / shrug art.

**Chip inventory (unchanged copy — art only):**

| like | no |
|------|-----|
| tasty | yucky taste |
| crunchy | too crunchy |
| soft | too soft |
| yummy smell | yucky smell |
| looks good | looks weird |
| warm | too hot |
| cold | too cold |

Pass several locked hero PNGs (and any locked why-chip PNGs) as style anchors
when generating so chips and foods stay one sticker sheet.

No contract changes. Insights / History surfaces that already use `WhyChipIcon`
pick up the new art automatically.

## Acceptance criteria

- [x] Every unique label in `allWhyChipLabels()` (14 = like ∪ no) renders from a
      committed `web/src/assets/why-chips/<slug>.png` via `WhyChipIcon` (static
      `<img>`, not the old inline SVG components).
- [x] `so_so` chips reuse the same PNG as the matching like/no label (no extra
      assets; no shrug / middling-only art).
- [x] Art follows the updated why-chip brief aligned with the food-icon sticker
      profile: shared cream ground, navy outline, one shine, no ground shadow;
      like vs no polarity unmistakable at chip size without reading the label.
- [x] Chip label strings and `whyNote` encode/decode behavior unchanged.
- [x] No OpenAPI, backend, or iOS project changes.
- [x] Tests: each unique label has a non-empty PNG + renders static img; brief
      lists all 14; existing why-chip / Run smoke that shows chips still passes;
      stale React SVG paths gone.

## Tasks

- [x] Docs: update `docs/design/why-chip-art-brief.md` (PNG-first, shared cream,
      hero-aligned style profile; keep motif + polarity tables; refresh prompt
      stem). Cross-link food-icon brief as the shared look.
- [x] Web: produce human-polished PNG masters for all 14 unique chips; map
      label→URL; `WhyChipIcon` loads static assets with `rounded-2xl`; remove
      inline SVG icon components.
- [x] Tests: asset coverage + render for every unique label; brief inventory
      coverage; so_so reuse assertion; no regressions in `whyChips` encoding.
- [x] Docs: on ship, archive this spec; Next up stays
      `on-demand-food-illustrations` (or re-rank if needed).

## Open questions

- None — ready for `/implement` after approval.
  (Filenames use underscore slugs; UI still keys off the human label string.)
