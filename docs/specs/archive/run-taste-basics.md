# Spec: run-taste-basics

Status: done  
Created: 2026-07-23  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-23 · enhancement  
Specced: 2026-07-24

## Problem

Run outcomes capture liked / texture / temperature / smell but not basic taste
words. Parents need a calm, kid-readable prompt to name what the food tasted
like (sweet, salty, bitter, sour) so nights are comparable and the child can
learn those words from **familiar food pictures** — not abstract labels alone
(e.g. umami-via-mushroom is useless here).

## Non-goals

- Insights aggregates / tips from taste basics (`insights-taste-basics`)
- “Foods matching his taste profile” discovery UI (`taste-profile-matches` —
  distinct from example icons on the taste buttons; leave that id planned)
- **Umami** (defer until the catalog can show it without collapsing into salty)
- Taste basics on **snack** foods (snacks keep free-text `tasteNote` only)
- Clinical taste panels, intensity scales, or AI-generated descriptors
- Native iOS / Android run UI (mobile sharedLogic DTOs only for contract sync)
- Requiring every outcome to include tastes (optional; skip allowed)
- Reworking unrelated run steps (liked / why / change / ate-enough / rewards)

## Approach

**Locked**

- Four taste values (API + UI): `sweet`, `salty`, `bitter`, `sour`.
- **Multi-select, optional** on each session food outcome: omit / empty /
  `null` = skipped; one or more values allowed; store unique set (order not
  meaningful for aggregates later).
- OpenAPI: new `TasteBasic` enum; `FoodOutcomeRequest` + `SessionFoodResponse`
  gain optional `tastes` array. Reject unknown values and `umami` → **400**.
- Web run: new step after **texture** (before temperature). Each taste is a
  toggle control showing the taste label plus **2–3 fixed starter-food example
  icons** (not the food being tasted that night):

  | Taste | Example `iconKey`s |
  |-------|--------------------|
  | sweet | `banana`, `strawberry`, `pancakes_choc_chip` |
  | salty | `soft_pretzel`, `cheese_pizza`, `chicken_nuggets` |
  | bitter | `broccoli`, `dark_chocolate`, `spinach` |
  | sour | `yogurt_plain`, `raspberry`, `strawberry` |

- Add three **system starter foods** (session-eligible, same pattern as
  `custom-food-icons` / V7): Broccoli, Dark chocolate, Spinach — with matching
  on-brand SVG `FoodIcon`s and shared `FOOD_ICON_KEYS` / backend keys.
- History detail + therapist PDF show selected tastes (same human labels).
- Persistence: column on `tasting_session_foods` holding the set (e.g. JSON
  array of enum strings with CHECK / app validation). Flyway next free version.

**Shape**

- Backend sessions module: enum, complete/list/get mapping, PDF labels.
- Contract + web types/clients + mobile sharedLogic DTOs.
- Web `RunSessionPage` / `RunSteps` multi-toggle + History / PDF paths.
- Unit + API + web tests for complete with multi tastes, skip, reject bad
  values; icon keys present; History/PDF labels.

## Acceptance criteria

- [x] `TasteBasic` is exactly `sweet`, `salty`, `bitter`, `sour`; OpenAPI + web
      + mobile clients aligned (no `umami`).
- [x] Completing a session accepts optional `tastes` arrays (0..4 unique values
      per food); empty/omit/null is allowed; duplicates collapsed.
- [x] Unknown taste or `umami` on write → **400**; unauthenticated complete
      still **401**; household scoping unchanged.
- [x] Web run includes a tastes step (after texture) with multi-select toggles;
      each option shows its label and 2–3 locked example icons from the table
      above.
- [x] System starters Broccoli / Dark chocolate / Spinach exist with icons;
      bitter button examples use those three keys.
- [x] History detail and therapist PDF display selected taste labels (or a
      clear empty/skipped presentation when none).
- [x] Insights endpoints unchanged this PR (no taste aggregates/tips).
- [x] Unit + API + web tests cover multi-select, skip, reject bad values, and
      example-icon / new-starter wiring enough to fail if reverted.
- [x] `ModularityTests` still pass.

## Tasks

- [x] Backend: Flyway column + starters; `TasteBasic` enum; complete/list/get +
      PDF; unit tests.
- [x] Contract: OpenAPI `TasteBasic` + `tastes` on outcome/response; align web +
      mobile clients.
- [x] Web: taste step UI (multi-toggle + example icons); History labels; new
      FoodIcon SVGs + keys for broccoli / dark_chocolate / spinach.
- [x] Tests: API IT (multi tastes, skip, reject umami/unknown); RunSessionPage +
      History coverage for tastes display/selection.

## Decisions (locked)

- Values: sweet / salty / bitter / sour — **no umami** in v1.
- Multi-select + optional.
- Example icons on the taste controls (2–3 per taste); not a separate matches
  screen.
- New starters for bitter examples: broccoli, dark chocolate, spinach.
- Capture on web run + History/PDF; Insights deferred.

## Open questions

_(none)_
