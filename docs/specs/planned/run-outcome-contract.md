# Spec stub: run-outcome-contract

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec run-outcome-contract`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Several ritual slices shipped web-first by encoding product meaning in the
client (why chips inside `whyNote`, labeled sections inside `parentNote`,
nullable outcome fields no longer collected on Run). That works while web is
the only Run client, but native iOS will otherwise re-learn undocumented
conventions — or drift from Insights tip matching.

## Non-goals (sketch)

- Rewriting the whole OpenAPI surface or unrelated modules
- Blocking `run-survey-shorten` or other active ritual polish
- Inventing clinical/coding schemas for free text

## Notes

- Ranked immediately before `run-tasting-session-ios`.
- Likely candidates: document or promote why-chip encoding; parent-note section
  labels; deprecate unused food-outcome fields (`temperature` / `smell` /
  `changeNote` if still demoted); keep web + mobile clients aligned in one PR.
- May split at `/spec` if promote-fields vs deprecate-fields diverge.
