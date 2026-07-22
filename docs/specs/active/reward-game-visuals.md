# Spec: reward-game-visuals

Status: draft  
Created: 2026-07-21  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-21 · enhancement

## Problem

Catch’s catcher still reads like a flat pong paddle (`run-catcher` bar), Cross
hazards are identical ▨ blocks that only slide sideways (straight-up path often
works), and celebrate / finish / HUD copy is uneven across the two games. Visual
polish plus simple static blocks and pattern changes after each crossing would
make Cross ask for L/R without turning it harsh.

## Non-goals

- Audio beds / SFX changes (`reward-game-audio` — already shipped)
- High-score history UI (`reward-high-scores`)
- Custom per-food illustration pack (`custom-food-icons`)
- Changing unlock rules, round length, or overall forgiving-bump behavior
- Harsh fail loops, lives systems, or maze-scale layouts
- Native SwiftUI / Android game UI
- OpenAPI / backend changes
- Confetti / celebrate FX beyond existing Cross pulse (`reward-celebrate-fx`)

## Approach

Web-only CSS / markup polish on Catch + Cross inside kitchen-run chrome, plus a
light Cross board pattern upgrade.

**Catch basket**

- Replace the flat paddle bar with a **basket / bowl silhouette** (CSS or simple
  SVG) that still uses the theme food as the falling piece.
- Keep the same catch hitbox / `CATCHER_WIDTH` fairness unless a tiny visual
  padding tweak is required for the silhouette (document if hitbox changes).
- Controls stay “Move basket left/right”; `aria-label="Basket"` remains accurate.

**Cross obstacles (moving + static)**

- Keep moving hazards; give them **≥3 visually distinct kinds** (emoji/CSS —
  no new binary art packs). Still forgiving bump-home.
- Add **static obstacles** (fixed cells; contact still bumps home — same
  forgiveness as movers).
- **Starting-column gate:** every pattern includes **at least one static**
  obstacle in the **starting column** on a traffic lane (not the start pad /
  goal), so a pure “up, up, up” path is blocked and L/R is required.
- **Pattern rotation:** after each successful crossing, rebuild / advance to
  the **next static pattern** (and may reshuffle moving-hazard spawn mix).
  Patterns stay short and readable (a few static cells), not a dense maze.
- Pure helpers for pattern pick + “has start-column static” so unit tests can
  lock the L/R requirement without flaky timers.

**Consistent text / hierarchy**

- Align Catch and Cross HUD + finish screens:
  - Score/timer line uses the same `run-prompt` / muted pairing.
  - Finish titles (“Nice catching!” / “Nice crossing!”) share size/weight
    classes; celebrate banner (“Crossed!”) uses the same display type family.
- Optional: short, parallel subcopy under finish titles (counts already exist —
  keep wording kid-simple and parallel).

**Layers / tests**

- Web only. Update Catch/Cross tests for basket, ≥3 moving kinds, static
  start-column gate, and pattern change after a crossing. No audio or API
  changes.

## Acceptance criteria

- [ ] Catch catcher reads as a **basket/bowl** (not a flat paddle bar) while
      play; falling pieces still use `FoodIcon` for the theme food.
- [ ] Catch hit detection remains fair (same effective catch band unless a
      documented tiny tweak); Left/Right / pointer controls still work.
- [ ] Cross moving hazards include **≥3 visually distinct kinds**.
- [ ] Cross includes **static** obstacles; contact still bumps home (forgiving).
- [ ] Every active pattern has **≥1 static obstacle in the starting column** on
      a traffic lane so straight-up alone cannot reach the goal (L/R required).
- [ ] After each successful crossing, the **static pattern changes** (next
      layout); still solvable and forgiving.
- [ ] Catch and Cross finish titles + HUD score/timer lines use a **consistent**
      run-prompt / brand type hierarchy (parallel layout/classes).
- [ ] No OpenAPI / backend / audio module changes required for this PR.
- [ ] Catch + Cross (+ reward) tests stay green; assertions cover basket,
      multi-kind movers, start-column static gate, and post-crossing pattern
      change.

## Tasks

- [ ] Web: Catch basket silhouette + kitchen-run CSS; keep hitbox fair; update
      Catch smoke tests.
- [ ] Web: Cross moving hazard kinds (≥3) + static obstacles; start-column
      static gate; pattern advances after each crossing; helper + UI tests.
- [ ] Web: Align Catch/Cross HUD + finish / celebrate typography classes.
- [ ] Tests: Basket, multi-kind, start-column static, pattern-after-crossing;
      keep Catch/Cross/reward suites green.

## Decisions (locked)

- **Platform:** Web reward games only.
- **Art:** CSS / emoji / inline SVG — no new licensed asset packs.
- **Obstacles:** ≥3 moving looks + static cells; start-column static required;
  pattern changes after each crossing; still forgiving bump-home.
- **Audio / scores / Match:** Out of scope.
- **Contract:** No OpenAPI / backend.

## Open questions

_(none — ready for approval)_
