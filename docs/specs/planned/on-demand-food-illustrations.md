# Spec stub: on-demand-food-illustrations

Status: planned (parked)  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · re-rank split (from `food-illustrations-ai`) · narrowed
2026-07-31 · re-rank split (customs only; store + non-heroes carved out)  
Parked: 2026-07-31 · Gemini image quota blocks beta (429); live ensure not worth
shipping until paid image quota or a deliberate offline-art batch path.

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec on-demand-food-illustrations` to flesh out Approach, Acceptance Criteria,
and Tasks before any code.

Work-in-progress branch (do **not** merge): `on-demand-food-illustrations`
(local; Gemini ensure + poll UI + cream/initials). Prefer staying on `main`
(emoji fallback + shared `iconUrl` store) until this is un-parked.

## Problem

Custom household foods (`custom_*`) still fall back to emoji/initials. Parents
need **online on-demand AI** generation into the **shared** illustration store so
kid-clear sticker art appears without hand-tuning every food — and so another
household naming the same food can reuse an existing image.

## Non-goals (sketch)

- Offline starter / hero PNG redraws (`non-hero-food-illustrations`,
  `hero-food-illustrations`)
- Building the shared object-store + `iconUrl` contract
  (`food-illustration-object-store` — prerequisite, **shipped**)
- Why-chip art; runtime AI inside the Run why-chip step
- Regenerating locked hero / non-hero static masters
- Email/notify PoC for manual art (rejected for beta)

## Notes

- Prerequisite shipped: [food-illustration-object-store](../archive/food-illustration-object-store.md).
- Art direction: [food-icon art brief](../../design/food-icon-art-brief.md).
- Scope = **customs only**; skip keys that already have static masters.
- Resume when: image model quota is usable, **or** an offline batch / admin
  upload path is preferred over live Gemini.
