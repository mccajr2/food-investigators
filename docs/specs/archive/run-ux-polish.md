# Spec: run-ux-polish

Status: done  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-30 · enhancement  
Completed: 2026-07-30

## Problem

Run survey UX gaps landed without a tracked slice: parents cannot step back
through tasting questions (or from reward food / which-game picks), and
multi-select confirm labels disagree — taste basics say **Done** while why says
**Continue**, which reads like the survey is finished mid-flow. Local Back work
was hanging unspecced after `why-chip-illustrations`.

## Non-goals

- So-so why chip copy / mixed good-bad sets (`so-so-why-detail`)
- Back during Catch / Cross / Match **in-play** (finish/quit stays as today)
- OpenAPI / backend / native iOS
- Changing Exit, Skip, or reward “Back to Plan” copy
- Parent-notes screen Back (deferred)

## Approach

**Web-only.** One Run header **Back** control:

1. **Survey** — step back within the current food’s step list; from the first
   step of food 2, jump to the last step of food 1. Disabled on the first step of
   food 1. When returning to why, restore chips + note via `decodeWhyNote` from
   the draft `whyNote`. Pure helpers `previousRunPosition` /
   `runStepsForFamiliarity` stay unit-testable.
2. **Reward pre-play** — Back on **food pick** and **which game**:
   - which-game → Back returns to food pick  
   - food pick → Back returns to the prior reward beat if one exists (e.g.
     encourage); if food pick is the first reward screen, Back is **disabled**  
   Do **not** un-complete the session or reopen survey steps. Back stays off
   during Catch / Cross / Match play and on parent notes.
3. **Taste multi-select** — rename confirm from Done → **Continue** (same as
   why). Game finish screens may keep Done.

Survey Back is already on this branch from the WIP stash; `/implement` finishes
Continue label + reward Back + remaining tests.

No contract changes.

## Acceptance criteria

- [x] Survey header shows **Back** next to Exit; disabled on food 1 / first step;
      enabled after advancing; pressing Back returns to the previous step
      (including last step of food 1 from food 2 step 0).
- [x] Returning to the why step restores selected chips and optional note from
      the stored draft (`decodeWhyNote`).
- [x] Taste basics multi-select confirm button label is **Continue** (not Done);
      why confirm remains Continue; Skip unchanged.
- [x] On reward **which-game**, Back is enabled and returns to **food pick**.
- [x] On reward **food pick**, Back is enabled when a prior reward phase exists
      (e.g. encourage); if food pick is the first reward screen, Back is disabled
      (session stays completed — no re-entry into survey).
- [x] Back remains disabled during Catch / Cross / Match play and parent notes.
- [x] No OpenAPI / backend / iOS changes.
- [x] Tests: `previousRunPosition` / `decodeWhyNote`; survey Back enable/disable +
      step retreat; taste confirm role name `Continue`; reward which-game Back →
      food pick.

## Tasks

- [x] Web: Survey Back + `previousRunPosition` + `decodeWhyNote` (+ survey Back
      tests) — **already on branch from WIP stash**
- [x] Web: Taste multi-select confirm label `Done` → `Continue`; update tests that
      click `Done` on that step.
- [x] Web: Enable Back through reward food-pick / which-game phase stack (not
      in-play games); wire `goBack` for `inReward` phases.
- [x] Tests: cover Continue label + reward which-game → food pick Back (survey
      Back tests already present).
- [x] Docs: leave `so-so-why-detail` planned for the follow-on.

## Open questions

- None — ready for `/pr`.
