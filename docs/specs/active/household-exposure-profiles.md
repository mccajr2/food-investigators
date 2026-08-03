# Spec: household-exposure-profiles

Status: in-progress  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · re-rank split  
Specced: 2026-08-03  
Branch: `household-exposure-profiles`

## Problem

Familiarity today exists only on planned session food slots, and defaulting Plan
to `safe` ignores what this child actually knows. Worse, **food id alone is the
wrong unit**: Bagelsaurus bagels can be safe while Trader Joe’s bagels are
familiar-but-new. Without a household **exposure profile** keyed by food +
presentation (variant), Plan stays noisy, known safes can’t be maintained, and
later signup / outcome / suggestion slices have no durable memory to read.

## Non-goals

- Signup intake wizard (`signup-safe-foods`) — invent-or-match foods at register
- Auto-updating exposures from completed runs (`familiarity-from-outcomes`)
- Suggesting foods not yet on the household list (`suggestion-adjacent-foods`)
- Science pacing pack (`suggestion-pacing-evidence`)
- Exploding the catalog into one food row per brand/prep
- Multi-child exposure profiles (`multi-child-profiles`)
- Clinical exposure hierarchies or therapist scoring
- Native Foods / Plan UI (mobile sharedLogic DTOs/clients only)
- Changing reward unlock rules or Run survey path logic
- Backfilling exposures from historical completed sessions (can wait for outcomes
  slice or a later migration — out of this PR)

## Approach

### Locked model

- **Catalog foods stay thin** (one “Bagel”). Brands/preps are **not** separate
  foods.
- Persist **exposure profiles** in the foods module, e.g. table
  `household_food_exposures`:
  - `household_id`, `food_id`, `variant_key`, `familiarity`, `source`
  - Optional nullable hooks for later pipeline (may ship null this PR):
    `attempt_count`, `last_tried_on`, `last_liked`
  - Unique `(household_id, food_id, variant_key)`
- `variant_key` = normalized presentation string: trim + case-fold; empty
  string `""` means unspecified / no note (valid key).
- `familiarity` uses the existing OpenAPI ladder:
  `safe` | `familiar_but_new` | `truly_new` | `retrying`
- `source` this PR: `manual` (and `signup` reserved for next slice — reject or
  unused on write until signup ships). Do **not** write `outcome` yet.
- System starters remain immutable food rows; exposures are the **household
  overlay** (same table keys `food_id` to a system or household food visible to
  that household).
- Snacks (`sessionEligible=false`): on create/update to snack, upsert exposure
  `(foodId, "")` → `safe` / `manual`.
- Session slots remain the source of truth **for that run**; exposures are the
  source of truth **between runs**. This PR does **not** rewrite exposures from
  complete-session.

### Plan autofill (minimize input)

When the parent changes `foodId` and/or `variantNote` on a Plan slot:

1. Normalize `variantNote` → `variant_key`.
2. If an exposure exists for `(foodId, variant_key)` → set slot `familiarity`
   from it (parent can still override).
3. Else if this food has any exposure with `familiarity=safe` (any variant) →
   default slot to `familiar_but_new`.
4. Else → default slot to `truly_new` (replace today’s unconditional `safe`
   default for newly chosen foods).
5. Empty food selection → no autofill / keep empty slot behavior.

Variant typeahead over known `variant_key`s for the selected food is **in
scope** if it fits the PR; otherwise a plain text field + autofill is enough
and typeahead can ride `plan-food-autocomplete` / a tiny follow-up. Prefer
shipping autofill even if variant suggestions are minimal (datalist or filter
from exposures returned on foods list).

### Foods UI (web)

- Surface household exposures: at least **known safes** (food name + variant
  label) with ability to **clear/toggle off safe** (delete exposure or set
  non-safe — pick one; prefer upsert non-safe or delete; document in AC).
- Ability to **add/edit** an exposure for a visible food (system or household):
  choose food, optional variant, set familiarity (full 4-value select).
- Starter foods section: allow “mark presentation” / add overlay without editing
  the system food row.
- Creating or marking a snack continues to set snack prefs; also ensures safe
  exposure on `(foodId, "")`.

### Contract / layers

- OpenAPI: exposure resource(s) and/or embed `exposures[]` on `FoodResponse`;
  create/update/upsert endpoints as needed. Bump API version per repo
  convention.
- Backend: foods module only for persistence; sessions Plan create/update
  unchanged (still accepts explicit `familiarity` on slots). Do not import
  sessions `internal` — mirror Familiarity values in foods (or shared public
  enum pattern already used for snack liked/texture).
- Web: Foods page + Plan autofill; align `web/src/api/*`.
- Mobile: sharedLogic Foods client/DTOs only.
- Tests: unit + API/IT for upsert/list/normalization/uniqueness; web tests for
  Plan autofill + Foods safe edit; `ModularityTests` green.

## Acceptance criteria

- [ ] Flyway creates `household_food_exposures` (or equivalent) with unique
      `(household_id, food_id, variant_key)` and Familiarity CHECK aligned to
      OpenAPI.
- [ ] Authenticated household can list exposures for its visible foods; cannot
      read/write another household’s rows (**401** unauthenticated, **403/404**
      cross-household as per existing foods patterns).
- [ ] Upsert exposure: set `familiarity` for `(foodId, variantKey)`; empty
      variant allowed; `variant_key` normalization is trim + case-fold (so
      `Bagelsaurus` and `bagelsaurus` collide).
- [ ] Parent can clear or change a safe exposure so Plan no longer autofills
      `safe` for that food+variant.
- [ ] Creating/updating a household food to `sessionEligible=false` upserts
      exposure `(foodId, "")` → `safe`.
- [ ] System food rows remain immutable; household can still add exposures
      referencing a system `food_id`.
- [ ] `GET /api/foods` (or documented companion endpoint) returns enough
      exposure data for Plan autofill without N+1 from the web client.
- [ ] Web Plan: changing food and/or variant note autofills familiarity per
      Approach rules; parent override still saved on the session slot.
- [ ] Web Foods: parent can view known safes / exposures and add or edit
      familiarity for a food+variant (including system starters via overlay).
- [ ] OpenAPI + web + mobile sharedLogic clients updated in the same change.
- [ ] Unit + API/IT + web tests cover persistence, normalization, snack→safe,
      Plan autofill defaults, and cross-household isolation.
- [ ] `ModularityTests` pass.
- [ ] No signup wizard, no complete-session → exposure writes, no suggestion
      shortlist changes in this PR.

## Tasks

- [ ] Backend: Flyway `household_food_exposures`; entity/repo; Familiarity (+
      source) in foods module; service upsert/list/delete-or-clear; snack create/
      update hooks → safe exposure; wire controller.
- [ ] Contract: OpenAPI schemas + paths; bump version; sync web types/client and
      mobile `FoodsClient` / DTOs.
- [ ] Web Foods: list/add/edit/clear exposures (safes first-class in UI).
- [ ] Web Plan: autofill familiarity from exposures when food/variant changes;
      replace unconditional `safe` default for newly chosen foods.
- [ ] Tests: foods unit + IT; web Plan autofill + Foods exposure UI; modularity.
- [ ] Docs: archive prep only after ship — keep this file in `active/` until done.

## Open questions

Resolved for this spec:

- Unit of familiarity = **food + variant**, not food alone.
- Catalog does **not** gain one row per brand.
- Outcome sync and signup invent-foods are **follow-on** roadmap ids.

Accepted risk:

- Variant typeahead polish may be thin in this PR (autofill is mandatory;
  fancy known-variant picker can be minimal).
- No historical backfill from past sessions — existing households start empty
  until parent marks safes or later outcomes/signup slices land.
