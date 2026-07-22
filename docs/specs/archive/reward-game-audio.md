# Spec: reward-game-audio

Status: done  
Created: 2026-07-21  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-21 · enhancement

## Problem

Catch is nearly silent and Cross only has jump / short chime / quiet bed. Kids
need clearer audio feedback without staring at the score: a negative cue when
Cross hits an obstacle, a stronger positive cheer when they cross (and when
Catch’s timer ends), a catch blip on each Catch score, and a Catch background
bed that feels similar to Cross but distinct.

## Non-goals

- Match / new game templates (`reward-match`)
- Catch basket art, Cross obstacle variety, HUD/celebrate **text** polish
  (`reward-game-visuals`)
- High-score persistence / history UI (`reward-high-scores`)
- Parent mute / volume control (`reward-mute-control` parking)
- Confetti / celebrate motion FX (`reward-celebrate-fx`)
- Licensed music, binary sample packs, or new npm audio deps — stay Web Audio
  synth (extend `crossAudio` patterns)
- Backend / OpenAPI / native game audio
- Changing game rules, difficulty, duration, or unlock conditions

## Approach

Web-only, client-side Web Audio (same soft-volume, no-asset style as
`web/src/components/run/crossAudio.ts`).

**Cross**

- Keep jump + bed; start/resume on first move (existing gesture pattern).
- On hazard bump (forgiving reset home): play a short **negative** “ouch”
  (distinct from jump — lower / dissonant / descending).
- On successful crossing: play a clearer **positive cheer** (may replace or
  extend today’s ascending chime so “made it” is obvious).
- When the round **timer ends**: play the same positive cheer family (do not
  cut audio off silently), then stop the bed/context after a short beat.
- Stop / cleanup on unmount (and after the end-cheer delay when finishing).

**Catch**

- Add `catchAudio` (or shared helpers + Catch-specific factory) with:
  - Quiet **bed** (similar pulse to Cross, different note set / interval so
    kids can tell which game they’re in)
  - **Catch blip** on each successful catch (score increment)
  - **Cheer** when the timer ends / finish screen appears (same family as
    Cross cheer, not identical)
- Start bed on first pointer/control gesture (or game mount after user already
  gestured into the reward flow — prefer first Catch interaction so autoplay
  policies stay happy); `stop` on unmount / Done.

**Shared**

- Soft gains; no new dependencies; degrade gracefully when `AudioContext` is
  unavailable (gameplay still works; helpers return null / no-ops).
- Unit-test factories (tones without throw + API surface); keep Catch/Cross
  component tests green (mock audio if needed).

## Acceptance criteria

- [x] Cross plays a distinct **negative** sound when the player hits a hazard
      (bump home), separate from jump and cheer.
- [x] Cross plays a clear **positive cheer** on each successful crossing
      (stronger / more celebratory than a single quiet blip).
- [x] Cross plays a **positive cheer** when the round timer ends / finish UI
      shows (same cheer family as a successful crossing).
- [x] Catch plays a quiet **background bed** while playing that is similar in
      style to Cross but audibly distinct (different notes and/or pacing).
- [x] Catch plays a short **blip** on each successful catch so score changes are
      hearable without watching the counter.
- [x] Catch plays a **positive cheer** when the round timer ends / finish UI
      shows (same family as Cross cheer, not identical).
- [x] Audio uses Web Audio synth only (no new binary samples / npm audio libs);
      missing `AudioContext` does not break play.
- [x] Beds and contexts stop on unmount / leaving the game (no orphan intervals).
- [x] No OpenAPI / backend changes; no visual redesign beyond wiring hooks.
- [x] Tests cover new audio helper APIs; Catch + Cross + reward tests stay green.

## Tasks

- [x] Web: Extend Cross audio — `playOuch` (or equivalent) + richer
      `playCrossing` / `playCheer`; wire hazard bump + crossing in `CrossGame`.
- [x] Web: Add Catch audio module (bed + catch blip + end cheer); wire in
      `CatchGame` (start on gesture, blip on catch, cheer on finish, stop on
      cleanup).
- [x] Tests: Unit tests for Cross + Catch audio factories; keep Catch/Cross
      component tests green (mock audio where timers/Strict Mode make real
      AudioContext flaky).

## Decisions (locked)

- **Platform:** Web reward games only.
- **Synthesis:** Web Audio only; soft volumes; null-safe when unavailable.
- **Mute UI:** Out of scope this PR (`reward-mute-control`).
- **Visuals / scores:** Out of scope (`reward-game-visuals`,
  `reward-high-scores`).
- **Contract:** No OpenAPI / backend.

## Open questions

_(none — ready for approval)_
