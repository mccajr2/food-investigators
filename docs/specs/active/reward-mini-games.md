# Spec: reward-mini-games

Status: approved  

Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

After a tasting night, kids who ate enough of a harder food get no immediate
payoff — the session just ends. Without a short, food-themed mini-game reward
on the iPad runner, the “ate enough” signal doesn’t feel like a win, and the
ritual loses a calm incentive to try again.

## Non-goals

- Native SwiftUI / Android game UI (`run-tasting-session-ios` / later)
- Persisting unlocks or a games catalog API (web-only this PR; replay /
  free-play is `free-play-games`)
- AI-generated mechanics or skins (`ai-game-variants`)
- More than **one** template this PR (Catch only; Cross / Match later)
- Unlock mid-run (before session `complete`)
- Complex 3D, long campaigns, or competitive multiplayer
- Changing how `ateEnough` is captured or the complete API contract

## Approach

Extend the **web iPad run flow** so that **after** `POST …/complete` succeeds,
the runner offers a **Catch** mini-game themed to an ate-enough food.

- **When:** Only on the post-complete screen (not during outcome steps).
- **Unlock rules:**
  - Foods with `ateEnough === true` are eligible.
  - **One** eligible → start Catch themed to that food (name + existing food
    icon).
  - **Two** eligible → short **pick** step (“Which food for your game?”) then
    Catch with the chosen theme.
  - **Zero** eligible → no game; show a short **encouraging** message that they
    can try again another night, then exit back to Plan (same as today’s end).
- **Catch template (only):** Short timed round (~30s) on large touch targets —
  themed pieces fall; kid catches them (tap/drag or large catcher control).
  Forgiving (no harsh fail state). End screen with Done → return to Plan.
- **Layers:** Web only. No OpenAPI / backend / sharedLogic changes. Reuse
  session food `name` / `iconKey` already on the completed `SessionResponse`.

## Acceptance criteria

- [ ] After a successful complete with **exactly one** `ateEnough: true` food,
      the runner offers Catch themed to that food (name + icon visible).
- [ ] After complete with **two** `ateEnough: true` foods, the runner shows a
      pick step; choosing one starts Catch with that theme.
- [ ] After complete with **zero** `ateEnough: true`, no game; encouraging
      try-again copy; path back to Plan.
- [ ] Catch is playable on web (iPad-oriented): large controls, short round,
      Done returns to Plan; no edit of past outcomes.
- [ ] No new API endpoints; existing complete request/response unchanged.
- [ ] No native game UI; no Cross/Match templates in this PR.
- [ ] Component/unit tests for unlock branching (0/1/2 ate-enough) and Catch
      smoke; existing run complete tests still green.

## Tasks

- [x] Web: Post-complete reward flow (encourage / pick / Catch) wired from
      `RunSessionPage` after successful complete.
- [x] Web: Catch mini-game component (food-themed skin from chosen session
      food; short round; Done → Plan).
- [ ] Tests: Run/reward branching (0/1/2) + Catch component smoke; keep run
      complete tests green.

## Decisions (locked)

- **Platform:** Web iPad runner only.
- **Timing:** After session complete (not mid-run).
- **Template this PR:** Catch only; other templates deferred to a later spec.
- **Theme pick:** If two ate-enough, kid/parent picks which food themes the game.
- **Zero ate-enough:** Encouraging message + exit; no consolation game.
- **Persistence:** None — client-only from completed session payload.

## Open questions

_(none — ready for approval)_
