# Spec stub: brand-identity

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-21  
Added: 2026-07-21 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec brand-identity`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

The web app still reads as a generic kitchen/template UI. We have an official
Food Investigators logo (navy, lime, coral, amber, sky, cream; bubbly type) and
want every parent and kid surface — Auth, Plan, History, Foods, run overlay, and
reward games (Catch / Cross / future Match chrome) — to feel like the same brand.

## Non-goals (sketch)

- Native iOS / Android branding (defer to `run-tasting-session-ios` and later)
- Custom per-food illustrations (`custom-food-icons`) — brand tokens first; food art later
- Redesigning game mechanics, difficulty, or reward unlock rules
- Therapist PDF letterhead polish (optional follow-up; not required for this slice)
- Full dark-mode redesign or multi-theme switcher

## Notes

- Logo source (this session): workspace asset
  `FoodInvestigatorsLogo-….png` (JPEG content) — copy into `web/public/` at
  `/spec` / `/implement` time; do not leave only under `.cursor` assets.
- `kid-run-ui` already scoped Fredoka/Nunito + `[data-theme="kitchen-run"]`; this
  slice should retune global + run tokens to the logo palette so games inherit.
- Blocked for `/spec` until `reward-cross` finishes (or is abandoned) if we want
  brand work on a clean branch; roadmap rank places it next after Cross.
