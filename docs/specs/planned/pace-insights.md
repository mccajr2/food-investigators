# Spec: pace-insights

Status: planned  
Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial  
Specced: 2026-07-23  
Demoted: 2026-07-23 — parked behind `snack-taste-log` so Insights v1 can include
snack texture/taste signal (not meal-session outcomes alone).

## Problem

After enough tasting nights, the parent needs a clear read on what’s working
(likes, textures, familiarity jumps that went poorly, ate-enough) so they can
adjust pace without losing him to boredom or frustration — while still choosing
foods themselves. History lists nights one-by-one; it doesn’t surface patterns
or gentle, ignorable tips.

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
- Building the snack catalog/log itself (`snack-taste-log`) — that ships first;
  this slice **consumes** snack preference data once it exists

## Approach

**Locked (from `/spec`, still valid when re-activated)**

- Insights + a few ignorable tips (not summaries alone).
- New **backend API** aggregates data (not web-only from History).
- Tip dismiss is **remembered** for the household (not visit-only).

**Sequencing note:** Re-run `/spec pace-insights` (or amend this draft) after
`snack-taste-log` ships so aggregates/tips explicitly include snack signal
alongside completed-session outcomes.

**Shape**

- Extend Modulith **`sessions`** (and/or small insights surface on related data)
  — no new module unless boundary review forces one.
- **`GET /api/insights`** (household-scoped, auth required): returns aggregate
  stats over completed sessions **plus snack preference data when available**,
  and up to **3** tips from a **fixed** tip-id catalog, **excluding** tip ids
  this household has dismissed.
- **`POST /api/insights/tips/{tipId}/dismiss`**: persists dismissal for this
  household; idempotent; unknown tip id → **400**; unauthenticated → **401**.
- Flyway: e.g. `insight_tip_dismissals(household_id, tip_id, dismissed_at)` with
  unique `(household_id, tip_id)`.
- Minimum data: fewer than **3** completed sessions → empty/insufficient state
  (stats may be zeroed or omitted; **no tips**). Document the threshold in the
  response (e.g. `completedSessionCount`, `ready: boolean`). Revisit whether
  snack-only volume can also contribute to “ready” when re-speccing.
- Aggregates (v1 draft): completed night count; ate-enough yes/no counts;
  liked (`like` / `so_so` / `no` / skipped) counts across food outcomes; top
  textures among outcomes where `liked=like` (when any); familiarity mix counts
  (`likes` / `familiar_but_new` / `truly_new`); **plus snack texture/taste
  aggregates** once `snack-taste-log` exists. Optional: parent-notes presence
  flag only — do **not** dump note text into tips copy in v1.
- Tips: small server-side rule set keyed by stable ids (e.g.
  `slow_down_truly_new`, `lean_into_crunchy`). Copy is calm and ignorable;
  never blocks Plan.
- **Web:** AuthShell tab **Insights** beside Plan / History / Foods. Page shows
  summary cards + tip cards with Dismiss. Empty state when not ready. No charts
  package — typography + simple counts.
- **OpenAPI** + web client + mobile sharedLogic DTOs/client in the same PR; no
  native Insights screen.
- Therapist PDF unchanged this PR.

## Acceptance criteria

_(Draft — confirm/amend via `/spec pace-insights` after snacks ship.)_

- [ ] Authenticated `GET /api/insights` returns household aggregates over
      completed sessions (and snack preference data when present).
- [ ] When not ready (threshold TBD with snacks), response indicates not ready
      and returns **no tips**; web shows an empty/insufficient state.
- [ ] When ready, response includes locked aggregate fields and **0–3** tips
      from the fixed catalog whose ids are not dismissed for this household.
- [ ] `POST …/tips/{tipId}/dismiss` persists dismissal; subsequent GET omits that
      tip; repeat dismiss is **200** idempotent; unknown tip id → **400**; other
      household cannot see or dismiss this household’s state.
- [ ] Web Insights tab loads the API, shows summaries + tips, and Dismiss removes
      the tip from the UI after a successful POST (and stays gone on reload).
- [ ] Unauthenticated insights/dismiss → **401**.
- [ ] OpenAPI + web + mobile sharedLogic clients aligned; unit + API + web tests
      cover ready/not-ready, tip exclusion after dismiss, and Insights empty/ready UI.
- [ ] Plan / History / run / PDF behavior unchanged except nav gains Insights.

## Tasks

_(Draft — refine when re-activated.)_

- [ ] Backend: Flyway dismissals; tip catalog + aggregate service (sessions +
      snacks); GET insights + POST dismiss; unit tests.
- [ ] Contract: OpenAPI schemas/paths; align web + mobile clients.
- [ ] Web: AuthShell Insights tab + page (summaries, tips, dismiss, empty state).
- [ ] Tests: API integration (ready/not-ready, dismiss, scoping); InsightsPage +
      shell nav coverage.

## Decisions (locked)

- **Dismiss:** remembered per household tip id (backend table).
- **Compute:** backend `GET /api/insights` (not client-only History fold).
- **Surface:** web laptop Insights tab; no native UI this PR.
- **Order:** `snack-taste-log` before this slice so Insights v1 isn’t meal-only.

## Open questions

- Exact ready threshold once snacks exist (sessions-only count vs sessions+snacks).
- Tip catalog rules that blend snack vs session signal.
