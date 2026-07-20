# Spec: session-history

Status: approved  

Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

Parents can plan and run tasting nights, but once a session is `completed` it
vanishes from Upcoming. Without a laptop view of past tries — foods, familiarity,
icon answers, why/change notes, and ate-enough — patterns stay invisible and
later therapist printouts / insights have nothing to browse.

## Non-goals

- Editing or correcting past outcomes (read-only this PR)
- Showing or managing **cancelled** sessions in History (still omitted; only
  `completed`)
- Print / PDF packet (`therapist-printout`)
- Charts, trends, or suggestions (`pace-insights`, `suggested-next-session`)
- Native iOS/Android history UI
- Changing Plan upcoming list behavior or the run flow
- Soft-delete / purge of completed history

## Approach

Extend the Modulith **`sessions`** module and **web** client so a signed-in parent
can **browse completed sessions** on the laptop.

- **API (OpenAPI):** Add `GET /api/sessions/history` — household-scoped list of
  `status=completed` sessions, newest first (`scheduledOn` desc, then
  `updatedAt` desc). Reuse existing `SessionResponse` / food outcome fields
  already returned by `GET /api/sessions/{sessionId}`. Do **not** change
  `GET /api/sessions` (upcoming `planned` only). Unauthenticated → 401; other
  household’s id → 404 on get.
- **Web:** Signed-in **History** section (nav alongside Plan / Foods). List past
  nights (date + two food names / familiarity summary). Selecting one shows a
  **read-only detail** of both foods’ outcomes (liked, texture, temperature,
  smell, whyNote, changeNote, ateEnough) plus variant notes. Empty state when
  none completed yet.
- **Mobile sharedLogic:** `listHistory()` (or equivalent) matching OpenAPI; no
  SwiftUI history screen.

## Acceptance criteria

- [ ] Authenticated parent can **list completed** sessions for their household
      (newest first); `planned` and `cancelled` are not included.
- [ ] Authenticated parent can **open one completed** session and see both foods’
      familiarity, variant notes, and run outcomes (liked / texture / temperature /
      smell / whyNote / changeNote / ateEnough), including nulls for skipped
      fields.
- [ ] Unauthenticated history requests → 401; other household’s sessions → 404
      on get; upcoming list endpoint behavior unchanged.
- [ ] Web (signed in): History nav + list + read-only detail (and empty state);
      no edit/save controls on past outcomes.
- [ ] `contracts/openapi.yaml` documents the history list path; web and
      sharedLogic clients match in the same change.
- [ ] Unit + API integration + web component tests; sharedLogic client tests;
      `ModularityTests` green.
- [ ] No native iOS/Android history UI; no print UI in this PR.

## Tasks

- [x] Backend: `listHistory` (completed, newest first) on sessions service /
      controller; household scoping; leave upcoming list unchanged.
- [x] Contract: Document `GET /api/sessions/history` (and any related notes) in
      `contracts/openapi.yaml`.
- [ ] Web: Sessions client `listHistory`; History page (list + read-only detail);
      AuthShell nav tab.
- [ ] Mobile sharedLogic: Sessions client history method (no SwiftUI UI).
- [ ] Tests: Module unit + API integration + web History component tests;
      sharedLogic client tests; keep `ModularityTests` green.

## Decisions (locked)

- **Read-only** — no post-run corrections in this PR.
- History = **`completed` only** (cancelled stay out of this view).
- Newest-first list; detail reuses existing session/outcome payload shape.
- Web laptop History tab; sharedLogic client only for mobile.

## Open questions

_(none — ready for approval)_
