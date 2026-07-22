# Spec stub: reward-high-scores

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-21  
Added: 2026-07-21 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-high-scores`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

After a Catch or Cross round there is nothing to beat next time. A simple
per-game best (and maybe last few scores) gives a kid a clear aim without
turning rewards into a heavy leaderboard product.

## Non-goals (sketch)

- Server-synced / household-wide leaderboards (parking / later API)
- Global public rankings or multiplayer
- Changing Catch/Cross core mechanics beyond showing score UI
- Match high scores (until Match exists)

## Notes

- Start local-only (e.g. `localStorage` keyed by game + household or device).
- Show best + “new best!” on finish screens; optional short recent list.
- Depends on games already feeling good — rank after audio + visuals.
