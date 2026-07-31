# Spec stub: why-chip-sticker-art

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-31  
Added: 2026-07-31 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec why-chip-sticker-art` to flesh out Approach, Acceptance Criteria, and
Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Why-chip icons shipped as React SVGs in `why-chip-illustrations`. Hero foods
later locked a stronger kid-clear **PNG sticker** pipeline (shared cream ground,
navy outline, brand shine, concept→pick→lock). Chips now look behind the heroes
on the same Run placemat — they need the same treatment so the ritual feels like
one world (and stays iOS-portable).

## Non-goals (sketch)

- Changing chip label strings or `whyNote` encoding
- Hero food art (`hero-food-illustrations`)
- Online on-demand generation (`on-demand-food-illustrations`)
- Runtime AI in Run

## Notes

- Follow `docs/design/food-icon-art-brief.md` style profile; extend or twin a
  why-chip brief for sense/polarity cues (like vs no).
- Unique chips ≈ like ∪ no (~14); so_so reuses those strings.
- Depends on / follows finishing `hero-food-illustrations` (style anchors exist).
- Confirm PNG path (e.g. `web/src/assets/why-chips/<label>.png`) at `/spec`.
