# Spec stub: ai-game-variants

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-11  
Added: 2026-07-11 · initial

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec ai-game-variants`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Template games need fresher skins/levels over time so rewards stay interesting;
AI can generate variants on top of the curated templates without inventing whole
new game engines.

## Non-goals (sketch)

- Replacing templates as the reliability baseline
- Unbounded codegen of arbitrary Unity-scale games
- Requiring AI for every unlock (fallback to static skins)

## Notes

- Depends on `reward-mini-games`.
- Cost, safety, and offline fallback belong in `/spec`.
