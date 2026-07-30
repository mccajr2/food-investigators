# Spec: early-run-date-snap

Status: done  
Created: 2026-07-29  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-29 · enhancement  
Specced: 2026-07-29  
Completed: 2026-07-29

## Problem

Parents can tap Run on a night planned for a future date. After complete,
History keeps the future `scheduledOn`, Upcoming drops the night, and Plan’s
calendar looks free — but create still returns 409 because a **completed**
session occupies that day. Early runs should confirm up front and move
`scheduledOn` to **today** so History, occupancy, and the calendar stay
aligned with when the tasting actually happened.

## Non-goals

- Vacation / away-from-iPad backfill of arbitrary past nights (`log-past-session`)
- Allowing multiple planned/completed sessions on one calendar day
- Changing Plan create rules to allow past dates
- Silent server-side snap on complete (no parent confirm)
- Offering “run early but keep the future date” (that recreates the bug)
- OpenAPI / complete-request changes
- Native iOS Run flow (`run-tasting-session-ios`)

## Approach

**Locked**

- **Confirm at Run start (web Plan → Run):** When the parent taps Run and the
  session’s `scheduledOn` is **after** local today, show a calm confirm before
  opening the runner: this night was planned for {date} — record it as today?
  - **Yes:** `PUT`/`update` the planned session to `scheduledOn = today` (same
    foods/familiarity via existing update API), then open Run with the updated
    session. No OpenAPI change.
  - **No / dismiss:** Do not start Run; leave the night on its planned date.
- **Same day:** If `scheduledOn` is today (or somehow past — shouldn’t appear in
  Upcoming), skip the dialog and open Run as today.
- **Today already occupied:** If another planned/completed night already owns
  today, the update will 409 — surface that clearly and do **not** open Run
  (parent finishes/cancels the other night first, or waits for the planned day).
- **After snap:** Upcoming list reflects today’s date; the former future day is
  free on the Plan calendar; complete leaves History dated today.
- **Layers:** Web Plan (Run entry) + existing sessions client update. Backend
  past-date checks use `app.calendar.zone` (default `America/New_York`) so
  “today” matches the parent’s evening local calendar, not UTC. No OpenAPI
  change.

## Acceptance criteria

- [x] Tapping Run on a planned night with `scheduledOn` **after** local today
      shows a confirm before the runner opens (planned date called out; record
      as today).
- [x] Choosing **Yes** updates the session to today’s ISO date via the existing
      update API (foods unchanged), then opens the runner with that session.
- [x] Choosing **No** / dismiss does not open the runner and does not change
      `scheduledOn`.
- [x] Tapping Run when `scheduledOn` is **today** opens the runner with no
      early-run confirm.
- [x] If updating to today fails because the day is occupied (409), show a clear
      error and do not open the runner.
- [x] After a successful early-run snap + complete, History shows today; the
      original future date is free to plan a new night (no false 409 from the
      completed early run).
- [x] No OpenAPI / backend rule / native Run changes in this PR.
- [x] Component tests cover: future date → confirm → update then run; dismiss
      skips run; today skips confirm; occupied-today error blocks run.

## Tasks

- [x] Web: Plan Run entry — early-run confirm + update-to-today then
      `setRunningSession`; handle 409; skip dialog when already today.
- [x] Tests: PlanPage (and/or small helper) coverage for the cases above.

## Decisions (locked)

- Confirm at **Run start**, not before complete.
- Snap to **today** only; no “keep future date while running early.”
- Reuse existing session **update** API — no contract change.
- Occupied today → error, no runner.

## Open questions

- _(none)_
