# Spec stub: taste-profile-matches

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-23  
Added: 2026-07-23 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec taste-profile-matches`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Parents want help comparing: “what else felt salty/sweet like this?” A small set of
food icons matching a taste profile would make the survey/Insights conversation
concrete without a dense catalog browser.

## Non-goals (sketch)

- Capturing or aggregating taste data (prior slices)
- Grocery search / external food DBs
- Auto-planning the next session (`suggested-next-session`)
- Native iOS UI

## Notes

- Depends on `run-taste-basics` (+ ideally `insights-taste-basics` for context).
- Likely a curated mapping from taste-basic tags → starter/household icon keys,
  shown as a large-button subset on Insights or after a run step — lock surface at
  `/spec`.
