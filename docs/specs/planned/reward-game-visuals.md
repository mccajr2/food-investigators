# Spec stub: reward-game-visuals

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-21  
Added: 2026-07-21 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-game-visuals`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Catch’s catcher reads like a pong paddle, Cross obstacles feel samey, and
celebrate / HUD copy is uneven. Small visual and layout polish would make both
rewards feel more like Food Investigators games and less like placeholders.

## Non-goals (sketch)

- Audio beds / SFX (`reward-game-audio`)
- High-score history (`reward-high-scores`)
- Custom food art pack (`custom-food-icons`)
- Changing unlock rules or round length dramatically
- Native game UI

## Notes

- Catch: basket (or bowl) silhouette using theme food; keep hitbox fair.
- Cross: 2–4 obstacle kinds (shape/speed/pattern), still forgiving.
- Align “Crossed!” / finish titles with run-prompt / brand type hierarchy.
- Prefer after `reward-game-audio` so polish ships on top of clearer feedback.
