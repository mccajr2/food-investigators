# Spec stub: plan-tasting-session

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-11  
Added: 2026-07-11 · initial

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec plan-tasting-session`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Parent plans ahead on the laptop: pick a date, choose exactly two foods from the
catalog, and set each food’s familiarity (likes / familiar-but-new / truly new)
before cooking night.

## Non-goals (sketch)

- Running the tasting UI on web
- App-suggested foods (later: `suggested-next-session`)
- Printable upcoming calendar (`printable-plan-calendar` in parking)

## Notes

- Depends on `food-catalog`.
- Early sessions will often be two already-liked foods to establish ritual.
