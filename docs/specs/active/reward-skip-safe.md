# Spec: reward-skip-safe

Status: draft  
Created: 2026-07-28  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement  
Specced: 2026-07-29

## Problem

Reward mini-games unlock whenever any food was marked ate-enough — including
nights that are only `safe`, and mixed nights where only the safe food cleared
that bar. Games should celebrate stretches and retries, not routine safe bites;
otherwise the carrot loses meaning while the habit is still forming.

## Non-goals

- Removing games entirely or adding new game types
- Changing ate-enough / complete / survey rules beyond **which foods** unlock
  the reward
- Skipping the whole post-complete reward UI (encourage still shows when no
  game is eligible)
- Backend / OpenAPI changes
- Native iOS Run reward rules (`run-tasting-session-ios`)
- Free-play outside a tasting (`free-play-games`)

## Approach

**Locked**

- **Eligibility:** A session food is reward-eligible only when
  `ateEnough === true` **and** `familiarity !== "safe"`.
  Stretch = `familiar` | `truly_new` | `retrying` (existing ladder values).
- **Phases unchanged:** `initialRewardPhase` still returns `encourage` when
  zero eligible, `pickGame` when one, `pick` when two — only the eligible set
  shrinks.
- **Mixed night (safe + stretch):** Games only if the stretch food is
  ate-enough. Safe alone never unlocks or themes a game.
- **Two stretch:** Parent discretion via ate-enough on either/both (unchanged
  pick flow).
- **Two safe:** Always encourage — no game pick (habit nights keep the calm
  finish without the carrot).
- **Layers:** Web only (`rewardFoods` + tests; Run wiring already uses
  `initialRewardPhase`). No OpenAPI / backend / iOS.

## Acceptance criteria

- [ ] `eligibleRewardFoods` excludes any food with familiarity `safe`, even if
      `ateEnough` is true.
- [ ] Session with two `safe` foods (any ate-enough combination) → initial
      reward phase is `encourage` (no pick / pickGame / play).
- [ ] Session with one `safe` + one stretch: only the stretch food ate-enough →
      opens toward a game (`pickGame` / play) themed on that stretch food.
- [ ] Same mixed session: only the safe food ate-enough (stretch not) →
      `encourage`, no game.
- [ ] Two stretch foods: ate-enough on either or both still offers games as
      today (single → `pickGame`; both → `pick`).
- [ ] Zero ate-enough (any familiarity mix) still → `encourage`.
- [ ] No OpenAPI / backend / iOS changes.
- [ ] Unit tests cover the cases above (extend `rewardFoods.test.ts`; Run page
      only if wiring diverges from `initialRewardPhase`).

## Tasks

- [ ] Web: Tighten `eligibleRewardFoods` (and any related copy if it implies
      safe foods unlock games).
- [ ] Tests: `rewardFoods` coverage for two-safe, mixed (stretch only / safe
      only), two-stretch, and zero ate-enough.

## Decisions (locked)

- Safe foods never unlock or theme reward games.
- Encourage remains the no-game path (do not skip the reward step entirely).
- Web-only; no contract change.

## Open questions

- _(none)_
