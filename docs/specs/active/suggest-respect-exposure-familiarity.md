# Spec: suggest-respect-exposure-familiarity

Status: in-progress  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

Suggest (heuristic and AI) assigns session-slot familiarity from pace/recent-night
hints and LLM free choice. It ignores household exposure profiles. Parents who
marked foods **Safe** see those same foods default to **Familiar but new** on
auto-plan — wrong for soft beta and for safe+stretch coaching.

## Non-goals

- Soft-beta ritual polish UI (`soft-beta-ritual-polish`)
- Changing Suggest food *selection* algorithms beyond familiarity/variant
  resolution
- Changing Plan manual autofill rules (except consuming any new Suggest fields)
- Stretch pathway depth, invent rules redesign

## Approach

**Source of truth:** household exposure profiles `(foodId, variantKey) →
familiarity` (same ladder as Plan autofill).

1. **FoodCatalog** exposes bounded household exposures with familiarity
   (`ExposureSnapshot`), not only safe rows.
2. **Resolve** catalog Suggest slots after pick (heuristic + AI): map
   familiarity (and presentation) from exposures before the response leaves the
   API. LLM familiarity is a fallback only when no exposure applies.
3. **Resolution rules** (catalog `foodId`, optional requested variant):
   - Exact `(foodId, normalized variant)` match → that familiarity + variant.
   - Blank requested variant → prefer `variantKey=""` exposure; else any **safe**
     exposure for that food (use that row’s variant); else sole exposure for
     that food; else pace/heuristic fallback.
   - Non-blank requested variant with no exact match → if any **safe** exists for
     the food, `familiar_but_new` (new presentation); else fallback / `truly_new`.
   - Invent slots (`foodId` null): keep proposed familiarity; no exposure
     override.
4. **Never** leave a food that has a safe exposure labeled non-safe when Suggest
   is proposing that safe presentation (exact or blank→safe fallback).
5. **OpenAPI 0.18.0:** document Suggest familiarity rules; add optional
   `variantNote` on `SuggestedSessionFood` for catalog presentation from the
   matched exposure (Plan maps it into the draft slot). Update web + mobile
   clients in the same change.
6. **Gemini brief:** include exposures with familiarity; instruct model to match
   them — server still enforces resolution.

## Acceptance criteria

- [ ] Household marks food A safe (any variant); heuristic Suggest that includes
      A returns familiarity `safe` (and the matched `variantNote` when non-blank).
- [ ] Same for AI Suggest path (mock LLM returns wrong familiarity → response
      still `safe` after resolve).
- [ ] Food with only `familiar_but_new` / `retrying` exposure → Suggest uses that
      familiarity when proposing the matching presentation.
- [ ] Invent slot familiarity unchanged by exposure resolver.
- [ ] OpenAPI 0.18.0 documents rules + `variantNote`; web + mobile parse
      `variantNote`.
- [ ] Unit + integration tests would fail if resolve were reverted.
- [ ] `ModularityTests` pass.

## Tasks

- [ ] Backend foods: `ExposureSnapshot` + `FoodCatalog.listExposures` (+ tests).
- [ ] Backend sessions: resolver; wire heuristic + `toSuggestedFood`; Gemini
      prompt/payload; unit tests.
- [ ] Backend: API integration coverage for safe → Suggest `safe`.
- [ ] Contract: OpenAPI 0.18.0.
- [ ] Web: types + Plan map `variantNote`; test Suggest→draft uses exposure
      familiarity from API (mock).
- [ ] Mobile: `SuggestedSessionFood.variantNote` parse test.
- [ ] Roadmap: active → done when shipped; Next up remains polish.

## Open questions

None — resolution mirrors Plan exact-match / safe-presentation intent; server
enforcement is mandatory even if the LLM mislabels.
