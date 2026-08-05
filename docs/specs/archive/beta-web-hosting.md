# Spec: beta-web-hosting

Status: done
Completed: 2026-08-05  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

Beta parents need a **browser URL** for Plan (laptop) and Run (iPad), not only a
local Vite server. The API prod lane (`beta-backend-hosting`) can already run on
Render + Neon, but the React client still defaults to laptop-only. Soft beta
needs a hosted static web front that calls the prod API over HTTPS, with CORS
and SPA routing that work on phone Safari / iPad.

## Non-goals

- Backend / Neon / Actuator / UptimeRobot (`beta-backend-hosting` — already
  shipped; this slice only **sets** `APP_CORS_ALLOWED_ORIGINS` on that service)
- Auto-deploy from GitHub Actions (`ci-cd-production`)
- Custom domain beyond Render’s default `*.onrender.com`
- Native iOS / Android / TestFlight distribution
- AuthShell mega-split, ritual polish, or new product features
- OpenAPI / contract changes (auth stays Bearer; no cookie domain redesign)
- R2 / food-illustration CDN wiring
- Staging environment

## Approach

**Lanes (keep clear alongside backend docs):**

| Lane | Web | API it calls |
|------|-----|--------------|
| Local | `cd web && npm run dev` (Vite proxies `/api` → `localhost:8080`) | Local `bootRun` |
| Prod (soft beta) | Render **Static Site** (Vite `dist/`) | Render API URL from `beta-backend-hosting` |

**Hosting shape:** Render **Static Site** only (not a free Web Service / Docker
Node host). Static Sites serve `dist/` without the free-tier sleep interstitial;
a Web Service deploy would show Render’s “waking up” banner on the UI — **do not
do that**. No UptimeRobot on the web URL; keep API keep-alive on
`/actuator/health` (backend hosting) so login/Suggest don’t wait on a cold API.

- Root / base directory: `web/`
- Build: `npm ci && npm run build` (Node matching `web/.nvmrc` / `packageManager`)
- Publish directory: `dist`
- **SPA rewrite:** all routes → `/index.html` (so client-side Plan/Run URLs work
  on refresh)

**API base URL (build-time):** Vite bakes `import.meta.env.VITE_API_BASE_URL` at
build. Set it on the Static Site to the **exact** API origin, e.g.
`https://food-investigators-api.onrender.com` (no trailing slash, no `/api`
suffix — clients already prefix `/api/...`).

Today’s production fallback in `web/src/config.ts` is `http://localhost:8080`
when unset — wrong for a hosted build. Change so **prod builds require**
`VITE_API_BASE_URL` (fail the build or assert at module load in non-DEV) so a
misconfigured Render deploy cannot silently call localhost.

**CORS (API side — operator step):** After the Static Site URL exists, set on
the API service:

`APP_CORS_ALLOWED_ORIGINS=https://<static-site>.onrender.com`

(Exact origin, no path. Redeploy/restart API if needed.) Document in
`docs/beta/web-hosting.md` and cross-link `docs/beta/backend-hosting.md`.

**Auth:** Existing Bearer token flow (no cookie SameSite work). Confirm
`allowCredentials` + allowlisted origin still works cross-origin (already the
CORS design from backend hosting).

**Blueprint (optional):** Extend `render.yaml` with a static site entry *or*
document dashboard-only create — either is fine if the operator guide is
complete.

**Contract:** none. **iOS:** none.

## Acceptance criteria

- [x] Render **Static Site** config in `render.yaml` + docs (operator creates live
      URL — checklist in `docs/beta/web-hosting.md` §8; required before invites).
- [x] Built app calls the **prod** API when `VITE_API_BASE_URL` is set at build
      time; no Vite `/api` proxy in prod (fail-closed if env missing).
- [x] Prod build **fails closed** if `VITE_API_BASE_URL` is missing/blank (no
      silent `localhost:8080` fallback for `import.meta.env.PROD`).
- [x] SPA rewrite `/*` → `/index.html` in `render.yaml` (+ documented for dashboard).
- [x] Local lane unchanged: `npm run dev` still proxies `/api` without requiring
      `VITE_API_BASE_URL`.
- [x] Operator docs (`docs/beta/web-hosting.md`) step through: create **Static
      Site** (warn against Web Service), set `VITE_API_BASE_URL`, find the web
      URL, set API `APP_CORS_ALLOWED_ORIGINS`, smoke signup/login from the
      hosted URL; remind API UptimeRobot stays on health (not the web URL).
- [x] README / soft-beta friends plan link the web hosting guide.
- [x] Unit/component test(s) cover prod vs dev `apiBaseUrl` resolution (missing
      env in prod is an error; local DEV still allows empty base for proxy).
- [x] No secrets committed; `.env.example` documents `VITE_API_BASE_URL` for
      prod builds.

## Tasks

- [x] Web: fail closed on missing `VITE_API_BASE_URL` in production builds;
      keep DEV proxy default (`""`).
- [x] Web: tests for `apiBaseUrl` / config behavior (prod missing env; prod with
      origin; DEV empty).
- [x] Docs: `docs/beta/web-hosting.md` (step-by-step URLs/env) + README /
      soft-beta plan links; note API CORS follow-up.
- [x] Infra (optional): add Static Site to `render.yaml` if it stays thin and
      matches dashboard steps.
- [x] Contract: **none**.
- [x] Backend code: **none** (CORS already supports `APP_CORS_ALLOWED_ORIGINS`;
      operator sets the value).
- [x] iOS: **none**.

## Open questions

- **Exact API URL** is environment-specific (whatever Render assigned the API
  service). Operator pastes it into `VITE_API_BASE_URL` — not hardcoded in git.
- **First deploy is human-in-the-loop:** creating the Static Site and setting
  CORS on the API is part of soft-beta readiness after this PR merges (same
  pattern as backend hosting §8).
- **UI cold starts / banners:** Must use Static Site. No web keep-alive. API
  cold starts are mitigated by existing UptimeRobot on `/actuator/health` only.
