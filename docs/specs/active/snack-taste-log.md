# Spec: snack-taste-log

Status: draft  
Created: 2026-07-23  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-23 · enhancement  
Specced: 2026-07-23

## Problem

He prefers snacks to meals, and snacks carry distinctive textures and tastes
(e.g. chips, salt-and-vinegar) that tasting sessions often miss. Parents need a
place to capture those preferences **outside** the two-food tasting ritual so
later Insights can use them — without treating snacks as Plan/run session foods.

## Non-goals

- Dated snack “log” / timeline of entries (preferences live on the food record)
- Including snacks as tasting-session foods, Plan picks, or reward themes
- Replacing the meal/session ritual with snack-only tracking
- Shipping Insights UI or aggregate tips (`pace-insights`)
- Changing system starter foods into snacks (starters stay session-eligible)
- Clinical nutrition scoring
- Native iOS / Android snack management UI
- New chart/analytics surfaces

## Approach

**Locked (from `/spec`)**

- Catalog + preferences **on the food record** (not a dated log).
- **Extend Foods** APIs/DTOs (not a separate `/api/snacks` resource).
- Preference fields: **liked + texture + optional free-text taste note**.

**Shape**

- Modulith **`foods`** module + web Foods / Plan clients.
- Add **`sessionEligible`** (boolean) on household foods:
  - `true` (default) = tasting/Plan food (current behavior).
  - `false` = snack — shown in Foods, **excluded** from Plan food pickers and
    from `FoodCatalog.findSelectable`.
  - System starters: always `sessionEligible=true`; create/update cannot mark
    them as snacks.
- Add optional snack preference fields (nullable; meaningful for snacks, ignored
  or cleared when converting back to session-eligible if simpler — prefer
  **keep values** if toggled, Plan still ignores them):
  - `liked` — same values as run outcomes: `like` | `so_so` | `no`
  - `texture` — same values: `soft` | `crunchy` | `chewy` | `wet`
  - `tasteNote` — free text, trim, blank → null, max **100** chars (e.g.
    “salt & vinegar”)
- Enums live in **`foods`** (mirror session vocabulary for OpenAPI/clients;
  do not import `sessions` internals).
- Flyway: columns on `foods` (or equivalent table) —
  `session_eligible BOOLEAN NOT NULL DEFAULT TRUE`,
  `liked` / `texture` / `taste_note` nullable.
- **API / OpenAPI:** extend `FoodResponse`, `CreateFoodRequest`,
  `UpdateFoodRequest`. List continues to return all non-filtered household +
  system foods (including snacks). Create session / update session keep using
  `findSelectable`, which must reject `sessionEligible=false`.
- Invalid: setting snack prefs on a `sessionEligible=true` food is allowed
  (harmless for Plan) **or** rejected with 400 — lock **allowed** (parent can
  fill prefs then flip to snack) to reduce UI friction.
- **Web Foods:** create/edit household foods with a “Snack (not for tasting)”
  control; when snack (or always), show liked / texture / taste note fields.
  Clear visual split or filter: tasting foods vs snacks (e.g. two sections).
- **Web Plan:** food pickers only offer `sessionEligible && !archived` foods
  (client filter + server selectable already enforces).
- **Mobile sharedLogic:** Foods DTOs/client updated; no native snack UI.
- Existing completed sessions that somehow referenced a food later marked snack
  remain readable via History (`findVisible`); no migration of past rows.

## Acceptance criteria

- [ ] Household foods can be created/updated with `sessionEligible=false` and
      optional `liked`, `texture`, `tasteNote` (trim; blank note → null; note
      max 100).
- [ ] System foods always remain session-eligible; attempts to mark them snack
      → **400**.
- [ ] `FoodCatalog.findSelectable` / Plan create+update reject snack foods
      (same class of failure as archived / unknown).
- [ ] Web Plan food pickers never list snacks.
- [ ] Web Foods can add/edit snacks with liked, texture, and optional taste
      note; tasting vs snack foods are distinguishable in the UI.
- [ ] `FoodResponse` (list/create/update) includes the new fields; OpenAPI +
      web + mobile sharedLogic clients aligned.
- [ ] Unauthenticated food writes still **401**; other-household rules unchanged.
- [ ] Unit + API + web tests cover snack create/update, selectable rejection,
      Plan picker exclusion, and Foods snack UI fields.

## Tasks

- [ ] Backend: Flyway columns; entity/DTOs; selectable + validation; unit tests.
- [ ] Contract: OpenAPI Food schemas; align web + mobile clients.
- [ ] Web: Foods snack flag + preference fields + tasting/snack presentation;
      Plan picker filters snacks.
- [ ] Tests: Foods API integration; FoodsPage + PlanPage coverage.

## Decisions (locked)

- Preferences on the food record (no dated log this PR).
- Extend Foods APIs (`sessionEligible` + liked/texture/tasteNote).
- System starters cannot be snacks.
- Taste note max 100 after trim.
- Insights consumption deferred to `pace-insights`.

## Open questions

_(none)_
