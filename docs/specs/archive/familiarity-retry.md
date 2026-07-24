# Spec: familiarity-retry

Status: done  
Created: 2026-07-23  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-23 · enhancement  
Specced: 2026-07-23

## Problem

Plan familiarity today is only Likes / Familiar but new / Truly new. Parents also
need a clear **Retrying** state for foods he rejected before (or a different
prep/brand of something that flopped) — distinct from safe foods and from first
exposure. “Likes” as a label understates the role of **safe** foods he
consistently eats.

## Non-goals

- Auto-proposing which foods to retry (`suggested-next-session`)
- Clinical exposure hierarchies or therapist scoring
- Changing reward unlock rules this PR
- Native iOS / Android plan UI (mobile sharedLogic DTOs only)
- Requiring a past “liked=no” history before allowing Retrying (parent judgment)
- Taste basics (sweet/salty/…) — separate slices

## Approach

**Locked**

- Four plan-time familiarity values (API + UI):
  1. **`safe`** — consistently eats (renames today’s `likes`)
  2. **`familiar_but_new`** — known food, new brand/prep/variety
  3. **`truly_new`** — first exposure
  4. **`retrying`** — tried before, didn’t land; trying again
- **API rename:** `likes` → `safe` everywhere (enum, OpenAPI, clients). Flyway
  migrates existing `tasting_session_foods.familiarity` rows `likes` → `safe`
  and updates the CHECK constraint. Reject legacy `likes` on write (**400**).
- Insights field rename: `familiarityLikes` → `familiaritySafe` (same count
  semantics). Tip copy that mentions “known foods” stays calm; no new tip id
  required this PR unless an existing tip string says “likes” literally — then
  reword to “safe foods”.
- **Retrying + variant note:** same rules as today for same-food dual slots
  (distinct variants required). Variant note remains **optional** for a single
  Retrying food; Plan UI helper text nudges brand/prep when Retrying is
  selected (not a hard 400 if blank).
- Surfaces: Plan familiarity pickers, History detail labels, therapist PDF
  familiarity labels, Insights familiarity summary labels/counts.

**Shape**

- Backend `Familiarity` enum + Flyway `V11__familiarity_safe_retrying.sql`
  (or next free version): UPDATE + drop/recreate CHECK.
- OpenAPI `Familiarity` enum; InsightsResponse `familiaritySafe`.
- Web Plan / History / Insights / PDF renderer paths that label familiarity.
- Mobile sharedLogic session + insights DTOs/clients (string enums).
- Unit + API + web tests for create/update with `safe`/`retrying`, migration
  acceptance via IT creating with `safe`, reject `likes`, Insights field name.

## Acceptance criteria

- [x] `Familiarity` supports exactly `safe`, `familiar_but_new`, `truly_new`,
      `retrying`; OpenAPI + web + mobile clients aligned.
- [x] Existing DB rows with `likes` are migrated to `safe`; CHECK forbids
      `likes`.
- [x] Plan create/update accept the four values; writing `likes` → **400**.
- [x] Web Plan pickers show Safe / Familiar but new / Truly new / Retrying;
      History + PDF use the same labels.
- [x] Insights returns `familiaritySafe` (not `familiarityLikes`) and UI shows
      Safe in the familiarity summary; counts include `safe` rows.
- [x] Unauthenticated session writes still **401**; household scoping unchanged.
- [x] Unit + API + web tests cover enum values, reject legacy `likes`, Plan
      picker options, and Insights field rename.
- [x] `ModularityTests` still pass.

## Tasks

- [x] Backend: Familiarity enum + Flyway migrate `likes`→`safe` + add
      `retrying`; Insights `familiaritySafe`; unit tests.
- [x] Contract: OpenAPI Familiarity + InsightsResponse; align web + mobile
      clients.
- [x] Web: Plan / History / PDF / Insights labels and Plan picker options.
- [x] Tests: API integration (create with `safe`/`retrying`, reject `likes`);
      PlanPage + InsightsPage coverage.

## Decisions (locked)

- API value **`safe`** replaces **`likes`** (not UI-only rename).
- Fourth value **`retrying`**.
- Variant note not newly required solely because of Retrying.
- Insights counter renamed to `familiaritySafe`.

## Open questions

_(none)_
