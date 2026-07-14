# Spec stub: therapist-printout

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-11  
Added: 2026-07-11 · initial

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec therapist-printout`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Parent wants a printable history packet for a doctor / food therapist: what was
tried, answers, notes, and what seemed to work or not — not an upcoming plan
calendar.

## Non-goals (sketch)

- EHR integration or therapist portal accounts
- Printable upcoming schedule (`printable-plan-calendar` in parking)
- Fancy branding over clarity of the log

## Notes

- Depends on `session-history`.
- Prefer browser print / PDF of a clean page.
