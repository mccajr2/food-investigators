# Spec: reward-game-audio

Status: draft  
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
- Stop / cleanup on unmount and when the round finishes (existing `stop`).

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
  unavailable (gamesplay still works; helpers return null / no-ops).
- Unit-test factories (tones without throw + API surface); keep Catch/Cross
  component tests green (mock audio if needed).

## Acceptance criteria

- [ ] Cross plays a distinct **negative** sound when the player hits a hazard
      (bump home), separate from jump and cheer.
- [ ] Cross plays a clear **positive cheer** on each successful crossing
      (stronger / more celebratory than a single quiet blip).
- [ ] Catch plays a quiet **background bed** while playing that is similar in
      style to Cross but audibly distinct (different notes and/or pacing).
- [ ] Catch plays a short **blip** on each successful catch so score changes are
      hearable without watching the counter.
- [ ] Catch plays a **positive cheer** when the round timer ends / finish UI
      shows (same family as Cross cheer, not identical).
- [ ] Audio uses Web Audio synth only (no new binary samples / npm audio libs);
      missing `AudioContext` does not break play.
- [ ] Beds and contexts stop on unmount / leaving the game (no orphan intervals).
- [ ] No OpenAPI / backend changes; no visual redesign beyond wiring hooks.
- [ ] Tests cover new audio helper APIs; Catch + Cross + reward tests stay green.

## Tasks

- [ ] Web: Extend Cross audio — `playOuch` (or equivalent) + richer
      `playCrossing` / `playCheer`; wire hazard bump + crossing in `CrossGame`.
- [ ] Web: Add Catch audio module (bed + catch blip + end cheer); wire in
      `CatchGame` (start on gesture, blip on catch, cheer on finish, stop on
      cleanup).
- [ ] Tests: Unit tests for Cross + Catch audio factories; keep Catch/Cross
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
