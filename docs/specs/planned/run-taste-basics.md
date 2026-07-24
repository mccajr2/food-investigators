# Spec stub: run-taste-basics

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-23  
Added: 2026-07-23 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec run-taste-basics`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Run outcomes capture liked/texture/temperature/smell but not basic taste words
(sweet, salty, bitter, sour, …). Parents need a calm prompt to name what the food
tasted like so they can compare nights and talk about food in kid-friendly terms.

## Non-goals (sketch)

- Insights aggregates/tips for taste basics (`insights-taste-basics`)
- Icon matching / “foods like this” UI (`taste-profile-matches`)
- Clinical taste panels or full sensory wheels
- AI-generated descriptors
- Native iOS run UI

## Notes

- Proposed basics (lock at `/spec`): sweet, salty, bitter, sour, umami — likely
  multi-select optional on each food outcome (and optionally snacks later).
- Ship capture on web run + History/PDF display this PR; Insights consumption
  deferred.
- Parallel to existing texture step; keep kid-facing copy simple.
