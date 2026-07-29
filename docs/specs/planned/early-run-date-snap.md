# Spec stub: early-run-date-snap

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec early-run-date-snap`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Parents can run a night planned for a future date today. After complete, History
keeps the future `scheduledOn`, Upcoming frees that date, and Plan’s calendar
looks open — but create still 409s because a completed session occupies the day.
Early runs should confirm and snap the session date to the real tasting day
(today) so occupancy and History stay truthful.

## Non-goals (sketch)

- Vacation / away-from-iPad backfill of arbitrary past nights (`log-past-session`)
- Allowing multiple completed sessions on one calendar day
- Changing Plan create rules for past dates

## Notes

- Confirm at Run start or before complete when `scheduledOn` > local today.
- Default: record as today; frees the planned future date for a new night.
- Complements shipped `plan-occupied-dates` + `session-plan-guards`.
