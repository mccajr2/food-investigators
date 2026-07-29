# Spec stub: log-past-session

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec log-past-session`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

**Parking.** Promote with `/roadmap` when vacation / away-from-iPad backfill is
needed. Do not fold into `early-run-date-snap`.

## Problem

Sometimes a tasting happens off-app (vacation, no iPad). Parents need an
intentional way to log a night on a **past** date without weakening everyday
Plan create rules.

## Non-goals (sketch)

- Early-run date snap (`early-run-date-snap`)
- Free-form historical import / bulk CSV
- Allowing multiple sessions per calendar day

## Notes

- Explicit “log a past night” flow with confirm; past `scheduledOn` allowed only there.
- After early-run snap so occupancy rules stay coherent.
