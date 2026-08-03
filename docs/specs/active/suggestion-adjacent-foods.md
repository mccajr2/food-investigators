# Spec: suggestion-adjacent-foods

Status: in-progress  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · re-rank split  
Specced: 2026-08-03  
Branch: `suggestion-adjacent-foods`

## Problem

Suggested sessions today shortlist only from foods already on the household /
session-eligible list. The product’s usefulness is recommending foods (and
presentations) **reasonably adjacent to safe exposures**, paced to this child’s
progress — including foods **not yet** in the catalog. Example: salt-and-vinegar
chips are a hit → Suggest proposes pickles; if pickles are not in the list, Approve
adds them programmatically. Dismissed Suggest drafts must not litter the catalog.

## Non-goals

- Science-backed pacing copy / evidence pack (`suggestion-pacing-evidence`)
- Prep rotation for disliked foods (`disliked-prep-rotation`)
- Parent-nominated stretch queue (`stretch-food-targets`)
- Auto-owned calendar (`app-driven-schedule`)
- Grocery ordering or meal plans
- Inventing **both** foods in one night (v1: **at most one invent**)
- Heuristic invent without AI (heuristic stays catalog-only)
- Native iOS / Android Suggest UI
- Changing Run, Insights tips catalog, or reward unlock rules
- Free-form invent from Plan create (outside Suggest→Approve)

## Approach

### Locked product rules

1. **Parent-led:** Suggest → review/swap → **Approve** or **Dismiss**. Never
   auto-schedule. Never invent into the catalog on Suggest/Dismiss.
2. **Composition:** Exactly two foods. **At most one invent** per draft. The
   **other slot must be Safe** — an existing catalog food with a household
   **safe** exposure profile (food + variant, including blank variant). If the
   household has no safe exposures yet, do not invent; fall back to today’s
   catalog-only suggestion behavior.
3. **AI invent (when ready):** Gemini may propose one adjacent food **by name**
   (+ optional presentation note), grounded in the household’s **safe exposure**
   set (and existing brief signals). The name need not be unique globally —
   match an existing system/household tasting food by case-insensitive name when
   present; otherwise treat as invent.
4. **Approve materializes invent:** On Approve only: resolve invent → match
   existing `sessionEligible` food by name **or** create a household tasting
   food (same invent path spirit as signup/bootstrap: default icon, session
   eligible). Then create the planned session via existing create rules with
   two real `foodId`s. Upsert an exposure for the invent slot’s
   `(foodId, normalized variant)` so it enters the personal pipeline (default
   familiarity from the draft — typically `familiar_but_new` or `truly_new`,
   **not** auto-`safe`; source `manual` or a documented invent path — prefer
   `manual` unless adding a new `ExposureSource` is cheap and called out).
5. **Heuristic fallback:** No invent. Keep picking two catalog shortlist foods
   (prefer including a safe-exposure food when available).

### Contract / API

- **Suggest response (`SuggestedSessionFood`):** allow invent proposals:
  - Catalog slot: `foodId` required (uuid), `name` / `iconKey` as today,
    `familiarity` (safe for the safe-anchor slot).
  - Invent slot: `foodId` **null**, `proposedName` required (non-blank),
    optional `proposedVariantNote`, `familiarity` for the stretch slot,
    `iconKey` may be a placeholder (e.g. omit illustration until created) —
    document clearly.
  - Exactly one of the two foods may be invent; the other must be a catalog
    safe anchor as above.
- **Approve:** Prefer **web orchestrates**: if invent → match-or-create food
  via existing foods APIs, then `POST /api/sessions` with two `foodId`s (keeps
  create-session contract stable). Optionally add a thin server helper later if
  that proves racy; v1 web orchestration is OK if documented and tested.
- OpenAPI version bump; sync **web + mobile** sharedLogic DTOs in the same PR
  (no native Plan UI).

### Backend suggestion pipeline

- Include **safe exposures** (food name, foodId, variantKey, familiarity) in the
  suggestion brief sent to the LLM (bounded list).
- Prompt: choose one **safe-anchor** from catalog shortlist / safe set; may
  propose **one** adjacent invent name not required to be on the shortlist;
  never invent both; never invent when no safes.
- Validate AI output: ≤1 invent; non-invent foodId ∈ allowed set; invent has
  usable `proposedName`; reject → heuristic.
- Modulith: sessions must not call foods `internal`; use public foods API /
  events / catalog port already used by suggestions.

### Web Plan

- Suggest panel shows invent slot distinctly (name + optional variant; not a
  catalog id yet).
- Parent may **swap** invent → catalog picker (clears invent) or change the
  safe slot among catalog foods (autofill familiarity as today).
- Approve: materialize invent if needed, upsert exposure for invent key, then
  create session; Dismiss: no writes.
- Empty / error states if invent create fails.

## Acceptance criteria

- [ ] When the household has ≥1 safe exposure and AI is used, Suggest **may**
      return exactly one invent (`foodId` null + `proposedName`) and one catalog
      food with `familiarity=safe` tied to a safe exposure.
- [ ] Suggest never invents when there are no safe exposures; never invents both
      slots; heuristic path never invents.
- [ ] Dismiss / Suggest alone does **not** create catalog foods or exposures.
- [ ] Approve of an invent: match existing tasting food by name **or** create
      household tasting food; then create planned session with two real food ids.
- [ ] Approve upserts an exposure for the invent `(foodId, normalized variant)`
      into the personal pipeline (not auto-`safe` unless the draft said safe —
      invent stretch should not be marked safe by default).
- [ ] Parent can swap invent to an existing catalog food before Approve.
- [ ] OpenAPI documents invent fields; version bump; web + mobile clients
      updated; web Plan Suggest/Approve E2E covered by component tests (mock
      clients).
- [ ] Unit + IT: invent proposal validation; approve match vs invent-create;
      dismiss no-op; ModularityTests pass.
- [ ] No changes to pacing-evidence, stretch targets, or native Plan UI.

## Tasks

- [ ] Backend: feed safe exposures into suggestion brief; LLM invent rules +
      validation (≤1 invent, safe anchor required); heuristic unchanged
      (catalog-only); unit tests with mocked LLM.
- [ ] Contract: `SuggestedSessionFood` invent fields (`foodId` nullable,
      `proposedName`, `proposedVariantNote`); version bump; web + mobile DTO
      sync.
- [ ] Web: Suggest panel invent display + swap; Approve match-or-create then
      session create + exposure upsert; tests.
- [ ] Backend IT (and/or web-mocked): invent approve path; dismiss does not
      invent; ModularityTests.
- [ ] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Corpus: AI / free-text invent allowed; match existing name when present.
- Materialize invent **on Approve only**.
- At most **one invent** per night; other slot is **Safe** (already in library /
  exposures).
- OpenAPI invent shape: nullable `foodId` + `proposedName` (+ optional variant).

Accepted risk:

- Web-orchestrated Approve invent (create food then create session) is two calls;
  acceptable for v1 if errors surface cleanly.
- “Adjacent” is LLM judgment from safe exposures + brief — no curated adjacency
  graph in this PR.
- Default invent icon may be generic until a later illustration slice.
