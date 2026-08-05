# Spec stub: staging-environment

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec staging-environment`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

**Parking.** Soft beta uses local + one prod. Promote if formal/cold beta needs
a dress rehearsal without touching friend data.

## Problem

Promoting straight from laptop to prod risks breaking live soft-beta families.
A cheap staging Render/Neon pair would mirror prod for smoke tests before
promote.

## Non-goals (sketch)

- Full multi-region HA
- Preview environments per PR (unless free/easy later)
- Replacing local Docker Postgres for daily dev

## Notes

- Soft beta: two lanes (local / prod) are enough — see roadmap Environments.
