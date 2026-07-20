# Spec stub: reward-cross-match

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-20  
Added: 2026-07-20 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-cross-match`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Catch shipped as the only post–ate-enough reward. Repeating the same game every
night gets stale; Cross (Frogger-lite) and Match (memory / 3-in-a-row lite) were
deferred so kids can pick or rotate among a small curated set with the same
food-themed skins.

## Non-goals (sketch)

- AI game mechanics (`ai-game-variants`)
- Free play outside tasting rewards (`free-play-games`)
- Persisting unlock catalog / backend games module (still client-side unless `/spec` says otherwise)
- Replacing Catch

## Notes

- Depends on `reward-mini-games` (Catch + post-complete unlock flow).
- If AC/tasks won’t fit one PR, `/roadmap` split into `reward-cross` + `reward-match`.
