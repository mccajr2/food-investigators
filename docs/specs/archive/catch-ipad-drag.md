# Spec: catch-ipad-drag

Status: archived  
Created: 2026-08-07  
Added: 2026-08-07 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

Catch already maps play-area pointer X to the basket, and that works with a
Mac trackpad. On iPad Safari the same finger drag is stolen as page scroll/pan
(no `touch-action: none`, no pointer capture), so kids cannot move the basket
intuitively and fall back to large Left/Right buttons. Soft-beta Run is iPad-
first; this blocks calm kid play without needing native iOS.

## Non-goals

- Cross swipe-to-move or Cross control redesign (D-pad taps already work)
- Match changes (card taps are fine)
- Native iOS / TestFlight / paid Apple Developer Program
- New Catch game rules, timing, hitboxes, or audio redesign
- Removing Left/Right entirely for keyboard/mouse users
- OpenAPI / backend / mobile sharedLogic changes

## Approach

**Web-only.** Harden Catch play-frame pointer handling: `touch-action: none`,
`setPointerCapture` on pointerdown, release on up/cancel, keep basket X mapping.
Add a short “Drag to move the basket” hint while playing. On coarse pointers,
demote or hide Left/Right so drag is the primary affordance; keep Done.

**Contract:** none. **Backend / iOS:** none.

## Acceptance criteria

- [x] On a touch device (or pointer simulation), dragging horizontally on the
      Catch play area moves the basket to follow finger X without scrolling the
      page.
- [x] Play area uses `touch-action: none` (or equivalent) and pointer capture
      for the active drag.
- [x] A short drag hint is visible while Catch is playing (not on the finish
      screen).
- [x] On coarse pointers, Left/Right are hidden or clearly secondary; Done
      remains.
- [x] Left/Right still work when shown (desktop / fine pointer).
- [x] No OpenAPI version bump; backend/mobile product code unchanged.

## Tasks

- [x] Web: Play-frame `touch-action: none` + `setPointerCapture` / release;
      harden pointer handlers so drag moves the basket (Vitest pointer drag
      regression in the same pass).
- [x] Web: Drag hint while playing; demote/hide Left/Right on coarse pointer.
- [x] Contract: **none**.
- [x] Backend: **none**.
- [x] iOS: **none**.

## Open questions

- None — Cross/Match explicitly out of scope; confirm Cross later only if kids
  struggle with the D-pad after Catch feels good.
