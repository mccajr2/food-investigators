# Spec stub: insights-taste-basics

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-23  
Added: 2026-07-23 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec insights-taste-basics`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

After `run-taste-basics` exists, Insights still won’t surface which taste basics
show up with likes — parents can’t spot “salty often lands” the way they can with
textures today.

## Non-goals (sketch)

- Capturing taste basics on the run (`run-taste-basics` ships first)
- Food-icon matching UI (`taste-profile-matches`)
- Chart libraries / dense analytics
- AI tips

## Notes

- Depends on `run-taste-basics` (and preferably some completed outcomes with data).
- Extend `GET /api/insights` aggregates + tip catalog (merged snack signal only if
  snacks also gain taste basics — decide at `/spec`).
