# Spec stub: signup-starter-snacks

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-23  
Added: 2026-07-23 · enhancement

Thin stub from `/roadmap` (**parking lot** — not ranked yet). **Not implementable
yet.** Promote into Upcoming via `/roadmap` re-rank, then `/spec signup-starter-snacks`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

New households start with a global starter catalog that may not match this
child. Parents should optionally name **their** early tasting foods and snacks
during signup so Foods (and later Insights) begin closer to reality — without
blocking registration if they skip.

## Non-goals (sketch)

- Requiring food/snack picks to finish signup
- Replacing the global system starter library entirely
- Multi-child profiles in the same flow
- Shipping before snack vs tasting food distinction exists (`snack-taste-log`)

## Notes

- Parked behind active `snack-taste-log` (and useful after snacks are first-class).
- Touches auth/register UX + Foods create; keep optional / skippable.
- May split at `/spec` into tasting starters vs snack picks if one PR is too big.
