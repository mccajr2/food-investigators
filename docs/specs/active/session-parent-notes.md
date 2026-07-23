# Spec: session-parent-notes

Status: in-progress  
Created: 2026-07-22  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-22 · enhancement

## Problem

After a tasting, the parent often has therapist-useful context (mood, setting,
what else was going on) that doesn’t fit kid-facing why/change notes. They need
an optional place to jot that **after** the kid’s reward beat so play still
comes immediately after tasting — then History and the therapist PDF can carry
it forward (and later `pace-insights`).

## Non-goals

- Replacing or changing per-food kid `whyNote` / `changeNote`
- Required notes or clinical instruments / structured fields
- Editing or adding notes from History in this PR
- Blocking return to Plan if the parent skips
- Moving `POST …/complete` to after notes (complete stays before reward)
- Native iOS / Android run UI for this beat
- Insights dashboard consumption (`pace-insights`)

## Approach

**Flow (locked)**

1. Run completes as today → `POST …/complete` → reward (or encourage).
2. After reward finish **or** encourage “Back to Plan”, show an optional
   **parent notes** screen (textarea + Save / Skip).
3. Save → `PATCH` parent note on the **completed** session → then return to Plan.
   Skip → return to Plan with note left null/empty (no PATCH required, or PATCH
   null — either is fine if idempotent).
4. Kid never waits on notes before playing.

**Backend / contract**

- Add nullable `parent_note` (TEXT / VARCHAR, max **2000**, trim; blank → null)
  on `tasting_sessions` via Flyway.
- Expose `parentNote` on `SessionResponse`.
- New endpoint e.g. `PATCH /api/sessions/{sessionId}/parent-note` with body
  `{ "parentNote": string | null }` — **only for `completed`** sessions in this
  household. Planned/cancelled → **409**. Unknown → **404**.
- Do **not** reopen general `PUT` update for completed sessions.
- History PDF renderer includes a “Parent notes” line when present.
- OpenAPI + web types/client + mobile sharedLogic DTOs in the same PR.

**Web**

- Insert notes beat in run/reward finish path (`RunSessionPage` /
  `RewardFlow`) after games/encourage, before `onComplete` closes the overlay.
- History detail shows parent notes when present.
- Therapist PDF download picks up server-rendered notes automatically.

## Acceptance criteria

- [ ] Completed sessions can store an optional `parentNote` (trim, max 2000;
      blank → null) via the new PATCH endpoint.
- [ ] PATCH on planned or cancelled sessions returns **409**; wrong household
      **404**.
- [ ] `SessionResponse` (get / history / complete response) includes
      `parentNote`.
- [ ] After Catch/Cross/Match finish **and** after encourage, the parent sees an
      optional notes screen before returning to Plan; Skip leaves no note (or
      null).
- [ ] Saving a note persists it and then returns to Plan; kid reward still ran
      before this screen.
- [ ] History detail shows the parent note when present; PDF includes it when
      present; absent note adds no empty clutter.
- [ ] Per-food why/change notes unchanged.
- [ ] OpenAPI + web + mobile client types aligned; unit/API/web tests cover
      PATCH rules, notes beat, History/PDF presence.

## Tasks

- [x] Backend: Flyway `parent_note`; entity/DTO; PATCH endpoint + validation;
      PDF line; unit tests.
- [x] Contract: OpenAPI path + `parentNote` on `SessionResponse`; align web +
      mobile clients.
- [x] Web: Post-reward/encourage notes screen (Save/Skip); wire PATCH; History
      display.
- [ ] Tests: API integration for PATCH + history/PDF; RunSession/RewardFlow +
      HistoryPage coverage.

## Decisions (locked)

- **Timing:** Notes UI after reward/encourage; `complete` stays before reward.
- **Persist:** `PATCH …/parent-note` on completed sessions only.
- **Optional:** Skip allowed; never block Plan.
- **Surfaces:** History detail + therapist PDF this PR; no History edit UI.
- **Length:** max 2000 characters after trim.

## Open questions

_(none)_
