# Spec: so-so-why-detail

Status: active  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-30 · enhancement  
Branch: `so-so-why-detail`

## Problem

So-so is a gray area — often a mix of good and bad (liked the smell, not the
texture). The overall **so-so** liked choice already covers “middling”; the why
step should capture **what was good vs bad**, not middling filler chips
(“kind of tasty”, “okay smell”, “looks okay”, “not sure”). Today’s so-so set is
only middling, so parents cannot record that mix. Like / No stay polarity-focused
on their own nights.

## Non-goals

- Changing Like / No chip sets or their icons
- Adding temperature chips to so-so (warm / cold / too hot / too cold stay on
  Like / No only)
- Middling / shrug chips on so-so (overall liked = so-so is enough)
- Clinical sensory panels or new OpenAPI fields for structured senses
- Runtime AI for chip suggestions
- Backend / Insights tip logic changes (tips still count chips only when
  `liked === like` or `liked === no`; so-so notes still show in recent whys)
- Migrating historical `whyNote` strings that used old middling chips
- Native iOS Run

## Approach

**Web-only.** Replace `WHY_CHIPS_BY_LIKED.so_so` with a curated **mixed polarity**
set that **reuses existing Like / No label strings** (and their existing
illustrations). Cap at **10** chips so the iPad multi-select stays tapable.

**Locked so-so chip list (order):**

| Polarity | Chips |
|----------|--------|
| Good | tasty, crunchy, soft, yummy smell, looks good |
| Bad | yucky taste, too crunchy, too soft, yucky smell, looks weird |

Remove middling-only strings from the so-so set: `kind of tasty`, `weird texture`,
`okay smell`, `looks okay`, `not sure`. Drop their icon map entries and art-brief
rows if nothing else references them (Like / No icons unchanged).

Update [why-chip art brief](../../design/why-chip-art-brief.md) so so-so is
documented as **mixed good/bad reuse**, not a third middling polarity style.

Encode / multi-select / `whyNote` behavior unchanged. No OpenAPI or backend.

## Acceptance criteria

- [ ] `WHY_CHIPS_BY_LIKED.so_so` is exactly the 10 locked strings above (good then
      bad), in that order.
- [ ] Like / No chip arrays are unchanged.
- [ ] Every so-so chip renders its existing illustration + label on the Run why
      step (no new art required; no middling-only icons remain required for the
      active catalog).
- [ ] Parent can multi-select a mix (e.g. “yummy smell” + “too crunchy”) and
      `encodeWhyNote` still joins in chip-set order.
- [ ] Art brief so-so section matches the mixed-polarity approach (no middling
      chip table as the active so-so set).
- [ ] No OpenAPI, backend, Insights calculator, or iOS changes.
- [ ] Tests: `whyChipsForLiked("so_so")` / icon coverage for the new set; Run why
      step still shows icon + label for a so-so chip; remove assertions tied to
      old middling strings.

## Tasks

- [ ] Web: replace `so_so` array in `whyChips.ts`; update unit tests.
- [ ] Web: prune middling-only entries from `whyChipIcons` (+ tests / art-brief
      coverage that iterates active chips).
- [ ] Docs: update `docs/design/why-chip-art-brief.md` so-so guidance + table.
- [ ] Tests: RunSessionPage / whyChipIcons coverage for new so-so set.
- [ ] Docs: on ship, archive this spec and advance roadmap Next up.

## Open questions

- None — ready for `/implement` after approval.
