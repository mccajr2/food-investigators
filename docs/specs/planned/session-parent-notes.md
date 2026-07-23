# Spec stub: session-parent-notes

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-22  
Added: 2026-07-22 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec session-parent-notes`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

After a tasting, the parent often has therapist-useful context (mood, setting,
what else was going on) that doesn’t fit kid-facing why/change notes. They need a
short place to jot that **after** the kid’s reward beat so play still comes
immediately after tasting.

## Non-goals (sketch)

- Replacing per-food kid `whyNote` / `changeNote`
- Clinical instruments or required fields
- Editing notes from History in the first cut (optional later)
- Blocking Back to Plan if the parent skips notes

## Notes

- Insert after reward finish (and after encourage-only path) before returning to
  Plan — optional free text, session-level.
- Surface on History + therapist PDF; feeds later `pace-insights`.
- OpenAPI + web (+ mobile clients if contract changes) in the same PR.
