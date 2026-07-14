# Spec stub: reward-mini-games

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-11  
Added: 2026-07-11 · initial

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-mini-games`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

When the parent marks that he ate enough of a food, unlock a simple mini-game
themed to that food (e.g. Frogger-like with a carrot, tic-tac-toe with chicken).
Start from a small set of curated templates with food skins — diverse enough to
hold attention, simple enough to maintain.

## Non-goals (sketch)

- AI-generated novel game mechanics (`ai-game-variants` later)
- Free play outside tasting rewards (`free-play-games` in parking)
- Complex 3D / long campaigns

## Notes

- Depends on `run-tasting-session` “ate enough” signal.
- Games run on iPad; keep controls huge and forgiving.
