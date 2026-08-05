# Spec stub: beta-web-hosting

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec beta-web-hosting`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Beta parents need a browser URL for Plan (laptop) and Run (iPad), not only a
local Vite server. Host the web client on Render pointed at the beta API.

## Non-goals (sketch)

- Backend / DB / keep-alive (`beta-backend-hosting`)
- Auto-deploy pipeline (`ci-cd-production`)
- Custom domain polish beyond what’s needed for beta
- Native app distribution

## Notes

- After `beta-backend-hosting`; wire `VITE_API_BASE_URL` (or equivalent) to prod API.
- CORS / cookie / auth cookie domain details at `/spec`.
- Document **local** (`npm run dev` → proxy/localhost API) vs **prod** (built
  assets + prod API URL) so soft-beta fixes are not tested only against laptop
  Postgres.
