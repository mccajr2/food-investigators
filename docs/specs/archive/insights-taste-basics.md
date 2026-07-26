# Spec: insights-taste-basics

Status: done  
Created: 2026-07-23  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-23 · enhancement  
Specced: 2026-07-24

## Problem

Taste basics are captured on the tasting run so the child can learn descriptive
words, but Insights still only surfaces liked textures — not which taste basics
tend to land with likes. Parents can’t spot patterns like “salty often works”
the way they already can for crunchy/soft.

## Non-goals

- **AI inference** of tastes on snacks or other foods (`snack-taste-ai` —
  parking; future PR)
- Manual taste fields on snack foods (keep snack free-text `tasteNote` as-is)
- Curated iconKey→taste maps as a stand-in for AI this PR
- Food-icon matching / “foods that match his taste profile” UI
  (`taste-profile-matches`)
- Changing ready threshold, tip dismiss storage, or snack merge for liked /
  texture (those stay as `pace-insights`)
- Chart libraries, dense analytics, or AI-generated tip copy
- Native iOS / Android Insights UI
- Therapist PDF / Plan / run survey changes (run already captures tastes)

## Approach

**Locked**

- Extend existing `GET /api/insights` aggregates + fixed tip catalog — no new
  endpoints.
- **Session outcomes only** for taste signal: among completed-session foods
  where `liked=like` and `tastes` is non-empty, count each selected
  `TasteBasic` (multi-select can increment several counters from one food).
- Snacks do **not** contribute to taste aggregates this PR (AI snack inference
  deferred).
- Response gains `topLikedTastes`: up to **3** taste enum strings by count
  (same shape as `topLikedTextures`); empty list when none.
- New tip id `lean_into_taste`: fires when the top liked taste has count ≥ 2
  (mirror `lean_into_texture`). Calm copy, e.g. “Salty tastes seem to land —
  lean into that when you pick foods.” Insert in evaluation order **after**
  `lean_into_texture` and **before** `celebrate_ate_enough`. Still max **3**
  tips; dismiss remembered via existing table / known-id set.
- Ready rule unchanged (≥ 3 completed sessions); tips still `[]` when not ready.
- OpenAPI + web Insights page + mobile sharedLogic DTOs in the same PR.

**Shape**

- Backend `InsightsCalculator` / response DTO: add `topLikedTastes`; register
  `lean_into_taste` in `KNOWN_TIP_IDS` and tip selection.
- Contract: `InsightsResponse.topLikedTastes` (array of `TasteBasic`); tip id
  docs mention the new id.
- Web Insights: show top liked tastes beside textures; tip dismiss works for
  the new id with no special-case UI.
- Unit + API + web tests for counting, tip fire/dismiss, and empty tastes.

## Acceptance criteria

- [x] Authenticated `GET /api/insights` includes `topLikedTastes` (0–3
      `TasteBasic` values) derived only from completed session foods with
      `liked=like` and non-empty `tastes`; snacks never affect this field.
- [x] Multi-select tastes on one liked food increment each selected taste’s
      count; skipped/empty tastes contribute nothing.
- [x] When ready and a top liked taste has count ≥ 2 (and tip not dismissed),
      tips may include `lean_into_taste` with calm copy naming that taste;
      evaluation order places it after `lean_into_texture`; max 3 tips still.
- [x] Dismiss of `lean_into_taste` persists; unknown tip ids still **400**;
      unauthenticated insights/dismiss still **401**.
- [x] Web Insights shows top liked tastes (human labels) when present; existing
      empty/not-ready and tip dismiss behavior unchanged otherwise.
- [x] OpenAPI + web + mobile sharedLogic clients aligned; unit + API + web
      tests cover taste aggregates, tip fire/exclusion, and UI label display.
- [x] Ready threshold, liked/texture snack merge, Plan/History/run/PDF
      unchanged; `ModularityTests` still pass.

## Tasks

- [x] Backend: `topLikedTastes` aggregate + `lean_into_taste` tip; unit tests.
- [x] Contract: OpenAPI `InsightsResponse` + tip id docs; align web + mobile
      clients.
- [x] Web: Insights page shows taste labels; tip dismiss covers new id.
- [x] Tests: API IT for taste counts + tip; InsightsPage coverage for tastes
      display.

## Decisions (locked)

- Taste Insights signal = **session run outcomes only** (kid language practice
  on the survey is the source of truth).
- **No snack taste contribution** this PR; no manual snack taste UI.
- **AI snack-taste inference** deferred to parking id `snack-taste-ai`.
- Tip: `lean_into_taste` mirrors texture tip thresholds and calm tone.

## Open questions

_(none)_
