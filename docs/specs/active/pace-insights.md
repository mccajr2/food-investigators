# Spec: pace-insights

Status: in-progress  
Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial  
Specced: 2026-07-23  
Re-activated: 2026-07-23 (after `snack-taste-log`)

## Problem

After enough tasting nights, the parent needs a clear read on what’s working
(likes, textures, familiarity jumps that went poorly, ate-enough) so they can
adjust pace without losing him to boredom or frustration — while still choosing
foods themselves. History lists nights one-by-one; it doesn’t surface patterns
or gentle, ignorable tips. Snack preferences now exist on the food record and
should strengthen that read without becoming a separate “snack insights”
product.

## Non-goals

- Auto-writing or proposing the next session’s foods (`suggested-next-session`)
- Clinical scoring instruments or therapist diagnosis language
- Push notifications / nagging / forced tip acknowledgment
- Chart libraries, sparklines, or dense analytics dashboards
- Editing History outcomes or parent notes from Insights
- Consuming tips into Plan create UI
- Native iOS / Android Insights UI
- AI-generated tips (fixed rule catalog only this PR)
- Soft-dismiss-only tips (dismiss is **remembered** per household)
- Snack-only readiness (snacks enrich aggregates/tips but do **not** unlock
  Insights)
- Separate snack-only tip copy / tip ids (merged counters only)

## Approach

**Locked**

- Insights + a few ignorable tips (not summaries alone).
- New **backend API** aggregates data (not web-only from History).
- Tip dismiss is **remembered** for the household (not visit-only).
- **Ready** = ≥ **3** completed tasting sessions. Snacks enrich merged
  liked/texture counters and tip evaluation but never count toward ready.
- **Merged signal:** session food outcomes + snack food `liked` / `texture`
  roll into the same counters; tip copy stays generic (no snack-only tip ids).

**Shape**

- Prefer Modulith **`sessions`** for the Insights API (completed-session
  source of truth). Read snack preference rows via a **small public foods
  port** (e.g. preference snapshot for household) — no imports of `foods`
  internals; Modulith boundaries must still pass `ModularityTests`. Only
  introduce a new module if that port forces an awkward boundary.
- **`GET /api/insights`** (household-scoped, auth required): returns
  aggregates + up to **3** tips from a fixed tip-id catalog, **excluding** tip
  ids this household has dismissed. Response includes
  `completedSessionCount`, `ready` (boolean), and aggregate fields even when
  not ready (zeros / empty lists OK); **tips always `[]` when `ready` is
  false**.
- **`POST /api/insights/tips/{tipId}/dismiss`**: persists dismissal for this
  household; idempotent **200**; unknown tip id → **400**; unauthenticated →
  **401**.
- Flyway: `insight_tip_dismissals(household_id, tip_id, dismissed_at)` with
  unique `(household_id, tip_id)`.
- **Aggregates (v1):**
  - `completedSessionCount`
  - `ateEnoughYes` / `ateEnoughNo` (session outcomes only)
  - `likedLike` / `likedSoSo` / `likedNo` / `likedSkipped` — **merged**:
    session outcome `liked` + snack foods with non-null `liked` (snacks never
    contribute to skipped)
  - `topLikedTextures` — up to 3 textures by count among rows where merged
    liked = `like` (session outcomes with texture + snacks with liked=like and
    non-null texture); empty if none
  - `familiarityLikes` / `familiarityFamiliarButNew` / `familiarityTrulyNew`
    (session plan familiarity on completed nights only)
  - `snackCount` — household snacks (`sessionEligible=false`, not archived)
    for context only
  - Optional: `hasParentNotes` boolean if any completed session has a parent
    note — do **not** dump note text into tips
- **Tip catalog (fixed ids + calm copy; evaluate in this order; return first
  matching up to 3, skipping dismissed):**
  1. `slow_down_truly_new` — among completed sessions, share of foods with
     familiarity `truly_new` that ended `liked=no` is high (e.g. ≥ 50% and at
     least 2 such truly-new outcomes). Copy: ease off truly new for a bit.
  2. `lean_into_texture` — a single texture appears ≥ 2 times in
     `topLikedTextures` signal (merged liked=like). Copy: lean into that
     texture when picking foods.
  3. `celebrate_ate_enough` — `ateEnoughYes` ≥ 3 and
     `ateEnoughYes` > `ateEnoughNo`. Copy: servings finishing well — keep that
     rhythm.
  4. `mix_familiarity` — when ready, if `familiarityTrulyNew` == 0 across all
     completed foods. Copy: consider one familiar-but-new or gentle new when
     ready.
  5. `keep_going` — fallback when ready and fewer than 3 tips matched above.
     Copy: calm keep-going encouragement (always eligible when ready unless
     dismissed).
- Tip evaluation uses merged counters where the rule mentions liked/texture;
  familiarity / ate-enough rules stay session-only.
- **Web:** AuthShell tab **Insights** beside Plan / History / Foods. Page shows
  summary counts + tip cards with Dismiss. Empty/insufficient state when
  `ready` is false (show progress toward 3 nights). No chart package —
  typography + simple counts.
- **OpenAPI** + web client + mobile sharedLogic DTOs/client in the same PR; no
  native Insights screen.
- Therapist PDF / Plan / History / run unchanged except nav gains Insights.

## Acceptance criteria

- [ ] Authenticated `GET /api/insights` returns household aggregates over
      completed sessions plus merged snack liked/texture into liked/texture
      counters; includes `completedSessionCount`, `ready`, and `snackCount`.
- [ ] When `completedSessionCount` < 3, `ready` is false and `tips` is `[]`;
      web shows an insufficient-data state (snacks alone never make it ready).
- [ ] When ready, response includes the locked aggregate fields and **0–3** tips
      from the fixed catalog (evaluation order above), excluding dismissed tip
      ids for this household.
- [ ] `POST /api/insights/tips/{tipId}/dismiss` persists dismissal; subsequent
      GET omits that tip; repeat dismiss is **200** idempotent; unknown tip id →
      **400**; other household cannot see or dismiss this household’s state.
- [ ] Web Insights tab loads the API, shows summaries + tips, and Dismiss
      removes the tip from the UI after a successful POST (and stays gone on
      reload).
- [ ] Unauthenticated insights/dismiss → **401**.
- [ ] OpenAPI + web + mobile sharedLogic clients aligned; unit + API + web
      tests cover ready/not-ready, merged snack signal in aggregates, tip
      exclusion after dismiss, and Insights empty/ready UI.
- [ ] Plan / History / run / PDF behavior unchanged except nav gains Insights;
      `ModularityTests` still pass.

## Tasks

- [x] Backend: Flyway dismissals; tip catalog + aggregate service (sessions +
      foods preference port); GET insights + POST dismiss; unit tests.
- [x] Contract: OpenAPI schemas/paths; align web + mobile clients.
- [x] Web: AuthShell Insights tab + page (summaries, tips, dismiss, empty
      state).
- [ ] Tests: API integration (ready/not-ready, dismiss, scoping, snack merge);
      InsightsPage + shell nav coverage.

## Decisions (locked)

- **Dismiss:** remembered per household tip id (backend table).
- **Compute:** backend `GET /api/insights` (not client-only History fold).
- **Surface:** web laptop Insights tab; no native UI this PR.
- **Ready:** ≥ 3 completed tasting sessions only.
- **Snacks:** merged into liked/texture counters; no snack-only tip ids;
  snacks do not affect readiness.
- **Tip catalog:** five fixed ids above (`keep_going` as fallback filler).

## Open questions

_(none)_
