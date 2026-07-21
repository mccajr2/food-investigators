# Spec: reward-cross

Status: approved  
Created: 2026-07-20  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-20 · re-rank split

## Problem

Catch is the only post–ate-enough reward. Playing the same falling-food game
every tasting night gets stale for a 5–6 year old. A second short template —
**Cross** (Frogger-lite, food-themed) — gives kids a real choice without waiting
on Match or AI variants.

## Non-goals

- Match / memory / 3-in-a-row (`reward-match`)
- AI skins or novel mechanics (`ai-game-variants`)
- Free play outside tasting rewards (`free-play-games`)
- Persisting unlocks or a backend games catalog (still client-side)
- Replacing or removing Catch
- Native SwiftUI / Android game UI (`run-tasting-session-ios`)
- Changing `ateEnough` capture or the complete OpenAPI contract
- Long campaigns, lives systems, or harsh fail-and-restart loops
- Forced random-only selection (Surprise is optional, not the only mode)

## Approach

Extend the **web iPad post-complete reward flow** so that when at least one food
has `ateEnough === true`, the kid can play **Catch or Cross**, both themed to the
chosen ate-enough food.

- **Unlock rules (unchanged):** 0 → encourage; 1 → that food themes the game;
  2 → food pick first (“Which food for your game?”).
- **Game pick (new):** After the theme food is known, show a short **Which game?**
  step with large tiles for **Catch**, **Cross**, and **Surprise** (same
  kitchen-run chrome).
  - Catch / Cross → start that game with the selected food skin.
  - Surprise → randomly choose Catch or Cross (equal chance), then start it
    with the selected food skin. Optional brief “Surprise: Catch!” / “Surprise:
    Cross!” beat before play so the kid knows what they got.
- **Cross template:** Short, forgiving Frogger-lite round on large touch targets —
  kid moves a themed piece across lanes toward a goal (or collects along the way).
  Reuse `FoodIcon` / name for theme. End screen with Done → Plan (same as Catch).
- **Catch:** Keep existing behavior; wire through the new game-pick step instead of
  jumping straight into Catch after food selection.
- **Layers:** Web only. No OpenAPI / backend / mobile sharedLogic changes.
- **Refactor (light):** Extend `RewardPhase` / `RewardFlow` for `pickGame` +
  `cross` (or equivalent); extract only what Cross and Catch must share
  (`food` + `onDone`). Pure helper for Surprise roll (easy to unit-test). Do not
  build a heavy plugin framework.

Split from former roadmap id `reward-cross-match` — Match deferred to
`reward-match`.

## Acceptance criteria

- [ ] After complete with ≥1 `ateEnough: true`, the runner shows a **Which game?**
      step offering Catch, Cross, and Surprise (after food pick when two foods
      qualify).
- [ ] Choosing Catch starts the existing Catch game themed to the selected food.
- [ ] Choosing Cross starts Cross themed to the selected food (name + icon visible).
- [ ] Choosing Surprise randomly starts Catch or Cross (equal chance) themed to
      the selected food; kid can tell which game started.
- [ ] Cross is playable on web (iPad-oriented): large controls, short round,
      forgiving outcome, Done returns to Plan; no edit of past outcomes.
- [ ] Zero `ateEnough` still shows encouragement only (no game pick).
- [ ] No new API endpoints; complete request/response unchanged.
- [ ] No Match template and no native game UI in this PR.
- [ ] Tests for reward branching including game pick, Surprise roll helper, +
      Cross smoke; Catch and existing run/complete tests stay green.

## Tasks

- [ ] Web: Extend reward phases for game pick (Catch / Cross / Surprise) + Cross;
      keep encourage / food-pick / Catch paths working.
- [ ] Web: Cross mini-game component (food-themed Frogger-lite; short round;
      Done → Plan) using kitchen-run chrome.
- [ ] Web: Surprise roll helper (Catch | Cross) + optional reveal beat before play.
- [ ] Tests: Reward branching (food + game pick + Surprise) + Cross smoke; keep
      Catch and run complete tests green.

## Decisions (locked)

- **This PR:** Cross only; Match → `reward-match`.
- **Selection:** Explicit **Which game?** tiles: Catch, Cross, and **Surprise**
  (Surprise = random Catch or Cross; not forced-random-only).
- **Platform:** Web iPad runner only.
- **Timing:** After session complete (same as Catch).
- **Persistence:** None — client-only from completed session payload.
- **Contract:** No OpenAPI / backend changes.

## Open questions

_(none — ready for approval)_
