# Spec stub: stretch-food-targets

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec stretch-food-targets`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Parents often know a stretch food they want to try someday (e.g. broccoli, a
restaurant dish) but don’t want to force it onto tonight’s Plan. Without a
durable “stretch target” queue, that goal lives only in the parent’s head, and
Suggest / Plan can’t pace it in when the child’s safe baseline and recent
progress make it a reasonable next try.

## Non-goals (sketch)

- Auto-creating calendar sessions without parent approve (`app-driven-schedule`)
- Replacing therapist judgment or clinical treatment planning
- System inventing stretch goals from scratch (`suggestion-adjacent-foods`)
- Science-evidence pack for pacing copy (`suggestion-pacing-evidence`)

## Notes

- Parent-nominated food+variant (invent OK); Suggest→Approve surfaces when ready.
- Depends on exposure profiles + ideally `familiarity-from-outcomes`,
  `suggestion-adjacent-foods`, and `suggestion-pacing-evidence` for timing.
- Keep parent-led: never force a stretch onto a night without approval.
