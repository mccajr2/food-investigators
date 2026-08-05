# Spec stub: authshell-split

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-04  
Added: 2026-08-04 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec authshell-split`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

`AuthShell` is the web composition-root god component (clients, auth, welcome,
settings, nav, feature wiring). Fine for one builder; painful before a formal
beta / larger team. Split into ApiProvider + AuthGate + AppShell without
changing product behavior.

## Non-goals (sketch)

- New product features or copy
- OpenAPI codegen
- Modulith SPI narrowing / insights module extract
- Decomposing PlanPage / FoodsPage (follow-on)

## Notes

- Formal-beta engineering tax (P0.3 from readiness review).
- Do not block soft beta on this slice.
