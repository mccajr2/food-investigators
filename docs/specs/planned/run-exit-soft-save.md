# Spec stub: run-exit-soft-save

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec run-exit-soft-save`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Warn-only Exit still discards a partially filled Run if the parent confirms
leave. Soft-beta families may lose a hard night’s answers when interrupted.

## Non-goals (sketch)

- Changing the kid survey itself (`run-survey-shorten`)
- Full offline sync (`offline-ipad-session`)
- Soft-beta ritual polish warn dialog (ships in `soft-beta-ritual-polish`)

## Notes

- Needs OpenAPI + backend (partial persist or draft complete); not web-only.
- Promote only if warn-only Exit still loses nights in soft beta.
