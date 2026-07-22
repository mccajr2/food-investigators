# Spec: reward-match

Status: done  
Created: 2026-07-20  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-20 · re-rank split

## Problem

Kids only get Catch or Cross after an ate-enough tasting. A third short template
keeps the reward set fresh for a tablet-fluent ~6-year-old without waiting on AI
variants. **Match** (memory / find-the-pairs) is the clearest third game: one
sentence of rules, large touch targets, and the theme food can show on the cards.

## Non-goals

- 3-in-a-row / match-3 / connect-three (explicitly deferred — not this PR)
- AI skins or novel mechanics (`ai-game-variants`)
- Free play outside tasting rewards (`free-play-games`)
- Replacing or removing Catch / Cross
- Native SwiftUI / Android Match UI
- OpenAPI / backend / synced scores (`reward-scores-sync`)
- Harsh fail loops, lives, or “wrong pair = game over”
- Dense art packs (`custom-food-icons` can improve card faces later)
- Parent mute UI (`reward-mute-control`)
- Confetti / celebrate FX beyond existing run cheer patterns
  (`reward-celebrate-fx`)

## Approach

Web-only extension of the post-complete reward flow (same unlock rules as Catch /
Cross).

**Game pick + Surprise**

- Add **Match** as a fourth large tile on **Which game?** (beside Catch, Cross,
  Surprise).
- **Surprise** randomly chooses among **Catch, Cross, and Match** with equal
  chance; reveal beat shows “Surprise: Match!” (same pattern as today).
- Extend `RewardGameKind`, `rollSurpriseGame`, `phaseForGame`, `gameLabel`, and
  `RewardFlow` / tests accordingly.

**Match template (memory)**

- Short, forgiving memory round on kitchen-run chrome, themed to the selected
  ate-enough food (name + `FoodIcon` in the HUD like Catch/Cross).
- **Grid:** 4×3 (12 cards = **6 pairs**). Large tap targets for iPad.
- **Pairs:** Include the **theme food** as at least one pair; fill remaining
  pairs from a small fixed set of known `FoodIcon` keys (or session-friendly
  icons) so faces stay readable without new art packs. Shuffle card order with
  an injectable RNG for tests.
- **Play:** Flip at most two face-up unmatched cards. Match → stay face-up /
  cleared; mismatch → flip back after a short delay (no penalty beyond time).
  Keep flipping until timer ends or all pairs are cleared.
- **Round length:** ~30s (same family as Catch/Cross; overridable in tests).
- **Score:** pairs matched this round. Finish early if the board is cleared.
- **Finish:** Shared run-prompt hierarchy — “Nice matching!” (or parallel
  wording), pair count, **Best: N**, **New best!** when applicable, Done → Plan.
- **Best:** Reuse `rewardBestScores` with game id `match` (localStorage; optional
  `householdId` prop like Catch/Cross).
- **Audio:** Light Web Audio — flip, match blip, end cheer / `playNewBest`
  (same mutually exclusive finish rule as Catch/Cross). No new npm audio deps.
- Pure board helpers (deal, flip, resolve mismatch/match) so unit tests don’t
  need flaky timers for core rules.

**Layers**

- Web only. No OpenAPI / backend / mobile.

## Acceptance criteria

- [x] After complete with ≥1 `ateEnough: true`, **Which game?** offers Catch,
      Cross, **Match**, and Surprise (after food pick when two foods qualify).
- [x] Choosing Match starts the memory game themed to the selected food.
- [x] Choosing Surprise randomly starts Catch, Cross, or Match (equal chance);
      reveal copy names the rolled game, including Match.
- [x] Match shows a 4×3 grid of large cards; theme food appears as at least one
      pair; play is flip-two / match-or-flip-back with no harsh fail.
- [x] Round is short (~30s) or ends early when all pairs are cleared; finish
      shows pairs matched + Best / New best! (localStorage) + Done → Plan.
- [x] On a new Match best, distinct new-best cheer replaces the normal end cheer
      (same rule as Catch/Cross).
- [x] Zero `ateEnough` still shows encouragement only (no game pick).
- [x] No OpenAPI / backend changes; no 3-in-a-row; Catch/Cross behavior unchanged
      aside from Surprise’s third option and the new pick tile.
- [x] Tests: Surprise 3-way roll helper, Match board helpers + smoke UI, reward
      flow pick/reveal; Catch/Cross/reward suites stay green.

## Tasks

- [x] Web: Extend reward kinds/phases — Match tile, 3-way Surprise roll + reveal,
      `phaseForGame` / labels; update RewardFlow + helpers tests.
- [x] Web: `MatchGame` memory board (4×3, theme pair, shuffle, flip/match,
      ~30s, finish Best wiring via `rewardBestScores`).
- [x] Web: Match Web Audio (flip / match / cheer / new-best) wired like
      Catch/Cross finish rules.
- [x] Tests: Board helpers + Match smoke + reward pick/Surprise; keep run suite
      green.

## Decisions (locked)

- **Template:** Memory (find pairs) — not 3-in-a-row.
- **Surprise:** Includes Match (equal chance with Catch and Cross).
- **Platform:** Web reward games only; no OpenAPI.
- **Scoring:** Pairs matched; local Best like Catch/Cross.
- **Tone:** Forgiving, short, large targets; kitchen-run chrome.

## Open questions

_(none — ready for approval)_
