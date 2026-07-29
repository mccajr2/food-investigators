# Spec stub: reward-skip-safe

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-28  
Added: 2026-07-28 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec reward-skip-safe`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Reward mini-games fire after a successful tasting even when both foods were
already `safe`. Games should celebrate stretches and retries, not routine safe
nights — otherwise the carrot loses meaning.

## Non-goals (sketch)

- Removing games entirely
- New game types
- Changing ate-enough / complete rules beyond when the reward is offered

## Notes

- Likely: skip reward flow when every completed food this session is `safe`.
- Confirm edge cases (one safe + one stretch) at `/spec`.
