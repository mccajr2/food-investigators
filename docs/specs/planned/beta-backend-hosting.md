# Spec stub: beta-backend-hosting

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec beta-backend-hosting`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Friends can’t try Food Investigators until the API and database are reachable
outside the laptop. Ship a beta “production” backend on Render with Neon
Postgres and UptimeRobot keep-alive so the service stays warm for light beta use.

## Non-goals (sketch)

- Web front hosting (`beta-web-hosting`)
- Auto-deploy CI (`ci-cd-production`)
- Multi-region / HA / paid scale-out
- Mobile TestFlight / App Store

## Notes

- Stack already named in AGENTS.md: Render + Neon + UptimeRobot.
- Secrets, env, migrations, and a smoke health check belong in `/spec`.
- **Next up** for soft beta (after welcome shipped). Pair with `beta-web-hosting`.
- `/spec` must define **local vs prod**: Compose Postgres locally; Neon in prod;
  no secrets in git; document Flyway on boot and health/keep-alive.
- Do not block on stretch depth or new games.
