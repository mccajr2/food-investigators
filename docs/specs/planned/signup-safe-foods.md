# Spec stub: signup-safe-foods

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-03  
Added: 2026-08-03 · re-rank split

Thin stub from `/roadmap` **re-rank split** (replaces `signup-starter-snacks`).
**Not implementable yet.** Run `/spec signup-safe-foods` after
`household-exposure-profiles` ships (or pair only if still one PR).

## Problem

New households start without a personal **safe** baseline. At signup, parents
should bootstrap **about 5–10 truly safe exposures** (base food + optional
brand/prep variant; snacks listed count as safe) so Plan, Insights, and
suggestions start from this child’s reality instead of a generic catalog.

**No expectation that named foods already exist in the DB.** A newly signed-up
family may invent foods the system has never seen — signup must create
household food rows (and safe exposure profiles) for novel names, and may
optionally match system starters when the parent selects one.

## Non-goals (sketch)

- Persisting the exposure-profile model itself (`household-exposure-profiles`)
- Requiring picks to finish registration (keep skippable with catalog defaults)
- Multi-child intake
- Replacing the global system starter library entirely
- Adjacent / beyond-catalog suggestions (`suggestion-adjacent-foods`)

## Notes

- Supersedes planned `signup-starter-snacks`.
- Depends on `household-exposure-profiles` — signup writes need durable
  `(food, variant)` safe rows.
- Open at `/spec`: invent-only vs invent-or-match UX; exact min/max (target 5–10).
