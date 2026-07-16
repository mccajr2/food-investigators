# Spec: plan-tasting-session

Status: draft  
Created: 2026-07-11  
Parent: [docs/roadmap.md](../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

Parents plan tasting nights ahead on the laptop: a date, exactly two foods from
the catalog, and how familiar each one is. Without a place to save and revise
those plans, cooking night starts from memory, hockey/play-date conflicts force
ad-hoc reshuffling, and later iPad sessions have nothing durable to open. Early
rituals often compare close variants (Honeycrisp vs Red Delicious, TJ’s vs
Costco nuggets) — that context needs to live on the plan, not only in the
parent’s head.

## Non-goals

- Running the tasting UI on web or iPad (`run-tasting-session`)
- Recording outcomes, “ate enough”, or free-text kid answers
- App-suggested foods (`suggested-next-session`)
- Printable upcoming calendar (`printable-plan-calendar`)
- Structured brand/variety/prep fields (optional free-text **variant note** only)
- Multi-child profiles; more or fewer than two foods per session
- Hard-delete of session history (cancel = soft status; keep row for later history)
- Android plan UI; iPad plan/manage UI (web only; sharedLogic client only)

## Approach

Add a Spring Modulith **`sessions`** module for household-scoped planned tasting
sessions, backed by the existing `foods` catalog and `accounts` Bearer auth.

- **Data:** `tasting_sessions` — `id`, `household_id`, `scheduled_on` (date),
  `status` (`planned` | `cancelled`), timestamps. `tasting_session_foods` —
  exactly two rows per session: `food_id`, `familiarity`
  (`likes` | `familiar_but_new` | `truly_new`), optional `variant_note`
  (free text, max 200), `position` (1|2). Reject archived foods and unknown
  food ids; both foods must belong to the catalog visible to the household
  (system starters or this household’s foods).
- **API (authenticated, OpenAPI):** create session; list upcoming
  (`status=planned`, ordered by `scheduled_on`); get one; update
  date/foods/familiarity/notes while still `planned`; cancel (`status=cancelled`).
  Cancelled sessions are omitted from the default upcoming list.
- **Web:** Signed-in Plan page — form to create (date + two food pickers +
  familiarity + optional variant note each); list upcoming with edit and cancel.
  Foods page remains available. No iPad plan UI.
- **Mobile:** `sharedLogic` client matching OpenAPI; no SwiftUI plan screen.

## Acceptance criteria

- [ ] Authenticated parent can **create** a planned session with a calendar date
      and exactly two foods; each food has familiarity
      (`likes` | `familiar_but_new` | `truly_new`) and optional `variantNote`
      (≤200 chars).
- [ ] Create rejects wrong food count, missing familiarity, unknown/archived
      foods, or invalid familiarity with 4xx.
- [ ] Authenticated parent can **list upcoming** planned sessions for their
      household (earliest date first); cancelled sessions are not listed by
      default.
- [ ] Authenticated parent can **update** a still-planned session (date, foods,
      familiarity, variant notes).
- [ ] Authenticated parent can **cancel** a planned session; it leaves the
      upcoming list and cannot be updated further (4xx).
- [ ] Unauthenticated session requests return 401; other households’ sessions
      are not visible or mutable (404).
- [ ] Web (signed in): Plan page supports create, list upcoming, edit, and
      cancel end-to-end; food pickers use the household food catalog.
- [ ] `contracts/openapi.yaml` documents session endpoints; web and sharedLogic
      clients match in the same change.
- [ ] Unit + API integration + web component tests; sharedLogic client tests;
      `ModularityTests` green.
- [ ] No iPad/Android plan management UI in this PR.

## Tasks

- [x] Backend: Flyway migration for `tasting_sessions` + `tasting_session_foods`;
      Modulith `sessions` module — create/list/get/update/cancel with household
      scoping and food validation.
- [x] Contract: Add session paths/schemas to `contracts/openapi.yaml`.
- [ ] Web: Sessions API client + Plan page (create form, upcoming list, edit,
      cancel); gate behind signed-in shell; navigate alongside Foods.
- [ ] Mobile sharedLogic: Sessions client matching OpenAPI (no SwiftUI plan UI).
- [ ] Tests: Module unit + API integration + web component tests; sharedLogic
      client tests; keep `ModularityTests` green.

## Decisions (locked)

- Web plans sessions; iPad runs them later — no plan UI on iOS this PR.
- Exactly two foods per session; familiarity is the three-level ladder above.
- Optional free-text **variant note** per planned food (brand/variety/prep);
  structured metadata deferred.
- Cancel is soft (`cancelled`); edit only while `planned`.
- List default = upcoming planned only.

## Open questions

_(none)_
