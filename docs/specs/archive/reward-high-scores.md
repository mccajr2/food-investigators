# Spec: reward-high-scores

Status: done  
Created: 2026-07-21  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-21 · enhancement

## Problem

After a Catch or Cross round there is nothing durable to beat next time. The
finish screen shows this round’s score, then it disappears — kids get no “Best:
N” target and no clear “New best!” moment. A single personal best per game gives
a calm aim without turning rewards into a leaderboard product.

## Non-goals

- Server-synced / household-wide leaderboards (`reward-scores-sync` parking)
- Global public rankings or multiplayer
- Recent-score history / last-N list UI (best only this PR)
- Showing Best in the in-play score strip (finish screen only)
- Changing Catch/Cross core mechanics, round length, or unlock rules
- Match high scores (until Match exists — `reward-match`)
- Parent mute / volume UI (`reward-mute-control`)
- OpenAPI / backend persistence
- Native iOS / Android score storage

## Approach

Web-only, local persistence + finish-screen UI + a distinct new-best cheer.

**Storage**

- `localStorage` on this browser/device.
- Separate best per game: Catch score (caught count) and Cross score (crossings).
- Key by game id; when a signed-in `householdId` is available, include it in the
  key so two households on the same browser don’t overwrite each other. If no
  household id is handy in the game tree without a larger prop drill, fall back
  to a device-scoped key and document that choice in the PR — do not invent an
  API just for the key.
- Pure helpers: `readBest`, `recordScore` → `{ best, isNewBest }` (idempotent /
  Strict Mode–safe).

**Finish UI**

- On Catch/Cross finish: show this round’s count **and** `Best: N`.
- When `isNewBest` (celebrate only when the new best is **≥ 1** and strictly
  greater than the previous stored best): show a clear **“New best!”** line
  using the shared `run-prompt` finish hierarchy.
- No in-play Best chip.

**Audio**

- Extend Catch/Cross Web Audio factories with a **`playNewBest`** (or shared
  helper) cheer that is audibly distinct from the normal round-end cheer /
  crossing cheer (longer / brighter / different intervals — still soft gains,
  no new npm audio deps).
- On finish: if new best → play **only** the new-best cheer (do **not** also
  fire the normal end cheer in the same moment). If not a new best → keep the
  existing end cheer behavior.
- Missing `AudioContext` must not break play or score persistence.

**Layers / tests**

- Web helpers + Catch/Cross finish wiring + audio API. Unit-test storage helpers
  (jsdom `localStorage`) and audio factory surface; component tests assert Best /
  New best! copy and that the new-best audio path is used when appropriate.

## Acceptance criteria

- [x] After a Catch round, the finish screen shows this round’s caught count and
      the stored **Best** for Catch on this browser (household-scoped when
      possible).
- [x] After a Cross round, the finish screen shows this round’s crossings and the
      stored **Best** for Cross on this browser (household-scoped when possible).
- [x] Beating the previous best persists the new value and shows a clear
      **“New best!”** on the finish screen (celebrate only when the new best is
      at least 1 and greater than the prior best).
- [x] A non-improving round still shows Best but does **not** show “New best!”
      and does not overwrite a higher stored best.
- [x] Best is **not** shown in the in-play score/timer strip (finish only).
- [x] On a new best, a **distinct** Web Audio cheer plays instead of (not stacked
      with) the normal round-end cheer; otherwise the existing end cheer remains.
- [x] Scores survive refresh / remount via `localStorage`; no OpenAPI / backend.
- [x] Catch + Cross (+ reward) tests stay green; helpers cover read/record and
      new-best detection; audio factory exposes a distinct new-best API.

## Tasks

- [x] Web: Pure best-score helpers (`localStorage` read/record per game;
      household key when available).
- [x] Web: Wire Catch + Cross finish screens — show Best; “New best!” when
      applicable; record score when the round ends.
- [x] Web: Add distinct `playNewBest` (Catch + Cross audio); on finish play
      new-best **or** existing end cheer, never both.
- [x] Tests: Helper unit tests + Catch/Cross finish assertions (Best / New best!
      + audio path); keep reward suite green.

## Decisions (locked)

- **Display:** Best only (no recent list); **finish screen only** (no in-play Best).
- **Audio:** Distinct new-best cheer; replaces normal end cheer when applicable.
- **Persistence:** Browser `localStorage` this PR (survives refresh; clears with
  site data / other devices). Household API sync stays in parking as
  `reward-scores-sync` — do not add OpenAPI/backend here.
- **Contract:** No OpenAPI / backend (`reward-scores-sync` later).
- **Platform:** Web reward games only.

## Open questions

_(none — ready for approval)_
