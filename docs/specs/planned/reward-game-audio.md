# Spec stub: reward-game-audio

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-21  
Added: 2026-07-21 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-game-audio`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Catch is nearly silent and Cross only has a thin jump/chime/bed set. Kids need
clearer audio feedback: ouch on Cross obstacles, cheer when crossing or when
Catch’s timer ends, a distinct Catch bed, and a catch blip so score changes are
heard without staring at the counter.

## Non-goals (sketch)

- New game templates (Match → `reward-match`)
- Visual basket / obstacle variety / HUD text polish (`reward-game-visuals`)
- High-score persistence (`reward-high-scores`)
- Licensed music libraries or large binary sample packs (prefer Web Audio synth
  like existing `crossAudio`)
- Backend / OpenAPI changes

## Notes

- Extend or share patterns from `web/src/components/run/crossAudio.ts`; Catch
  bed should feel similar but distinct from Cross.
- Mute / reduced-motion / low-volume parent control can land here or follow-up.
