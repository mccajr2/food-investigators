# Spec: reward-skip-safe

Status: done  
Created: 2026-07-28  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement  
Specced: 2026-07-29  
Completed: 2026-07-30

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
- **Phases:** `initialRewardPhase` returns `encourage` when zero eligible,
  `pickGame` when one, `pick` when two — only the eligible set shrinks.
- **Encourage copy:** Branch on tone — `tryAgain` when nobody ate enough
  (keep game-forward try-again copy); `habit` when something was ate-enough
  but only safe qualified (warm habit close, **no** game mention).
- **Mixed night (safe + stretch):** Games only if the stretch food is
  ate-enough. Safe alone never unlocks or themes a game.
- **Two stretch:** Parent discretion via ate-enough on either/both (unchanged
  pick flow).
- **Two safe:** Always encourage — habit tone if any ate-enough, else
  tryAgain.
- **Layers:** Web only (`rewardFoods` + `RewardFlow` + tests). No OpenAPI /
  backend / iOS.

## Acceptance criteria

- [x] `eligibleRewardFoods` excludes any food with familiarity `safe`, even if
      `ateEnough` is true.
- [x] Session with two `safe` foods (any ate-enough combination) → initial
      reward phase is `encourage` (no pick / pickGame / play).
- [x] Session with one `safe` + one stretch: only the stretch food ate-enough →
      opens toward a game (`pickGame` / play) themed on that stretch food.
- [x] Same mixed session: only the safe food ate-enough (stretch not) →
      `encourage`, no game.
- [x] Two stretch foods: ate-enough on either or both still offers games as
      today (single → `pickGame`; both → `pick`).
- [x] Zero ate-enough (any familiarity mix) still → `encourage` with
      `tryAgain` tone (game-forward copy OK).
- [x] Ate-enough but only safe qualified → `encourage` with `habit` tone
      (no game mention; not “eating enough is hard”).
- [x] No OpenAPI / backend / iOS changes.
- [x] Unit tests cover the cases above (extend `rewardFoods.test.ts`; Run page
      only if wiring diverges from `initialRewardPhase`).

## Tasks

- [x] Web: Tighten `eligibleRewardFoods` (and any related copy if it implies
      safe foods unlock games).
- [x] Tests: `rewardFoods` coverage for two-safe, mixed (stretch only / safe
      only), two-stretch, and zero ate-enough.
- [x] Web: Branch encourage copy (`tryAgain` vs `habit`) + tests.

## Decisions (locked)

- Safe foods never unlock or theme reward games.
- Encourage remains the no-game path (do not skip the reward step entirely).
- Encourage copy branches: `habit` when any ate-enough but no stretch
  eligible; `tryAgain` when nobody ate enough.
- Web-only; no contract change.

## Open questions

- _(none)_
