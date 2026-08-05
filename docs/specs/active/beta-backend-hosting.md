# Spec: beta-backend-hosting

Status: in-progress  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

Friends can’t try Food Investigators until the API and database are reachable
outside the laptop. Soft beta needs a **prod lane**: Neon Postgres + a Render
Web Service for the Spring Boot API, with a cheap keep-alive so free-tier sleep
doesn’t kill the first invite. Today there is no container/deploy story, no
public health probe (security requires auth for everything except register /
login), and CORS only allows localhost Vite origins.

## Non-goals

- Web front hosting (`beta-web-hosting`) — separate slice; this PR only prepares
  the API + env-driven CORS so that slice can add the Render web origin.
- Auto-deploy from CI (`ci-cd-production`) — manual first deploy / dashboard or
  Blueprint is enough; GitHub Actions deploy later.
- Staging environment (`staging-environment`)
- Custom domain / TLS beyond Render’s default `*.onrender.com`
- Multi-region, HA, autoscaling, paid scale-out
- Mobile TestFlight / App Store
- Product OpenAPI changes — health is **ops**, not a contract resource
- Shipping R2/object-store wiring as a must-have (in-memory illustrations OK if
  env unset, same as local)
- Secrets scanning / vuln / license CI suites

## Approach

**Lanes (document and keep clear):**

| Lane | App | Data | Secrets |
|------|-----|------|---------|
| Local | `./gradlew :backend:bootRun` | Docker Compose Postgres (`docker-compose.yml`) | `backend/.env` (gitignored) |
| Prod (soft beta) | Render Web Service (Docker) | Neon Postgres | Render env vars / secret files — never commit |

**Runtime packaging:** Add a root **Dockerfile** (multi-stage: JDK 25 build →
JRE 25 run `bootJar`). Prefer Docker over Render’s native build so we control
Java 25 and match CI. Optional `render.yaml` Blueprint for the Web Service is
nice-to-have if it stays thin; dashboard steps must be documented either way.

**Config for prod:**

- Bind `server.port` to Render’s `PORT` (default 8080 locally).
- Datasource via Spring env overrides (`SPRING_DATASOURCE_URL` /
  `USERNAME` / `PASSWORD`) pointing at Neon (SSL as Neon requires).
- Flyway runs on boot (`ddl-auto: validate` stays) — first deploy migrates.
- Set `GEMINI_API_KEY` (and existing `GEMINI_*` / calendar / illustration envs as
  needed) in Render; document the required vs optional list.
- **CORS:** keep current localhost Vite origins; add
  `APP_CORS_ALLOWED_ORIGINS` (comma-separated) so `beta-web-hosting` can append
  the Render static URL without another backend design pass.

**Health / keep-alive (Actuator — long-term path):**

- Depend on `spring-boot-starter-actuator`.
- Expose **only** `health` (`management.endpoints.web.exposure.include=health`).
- `management.endpoint.health.show-details=never` (no datasource URLs/secrets).
- `permitAll` for `GET /actuator/health` (and OPTIONS if needed).
- **No OpenAPI** entry for this path.
- Document UptimeRobot (or equivalent) HTTP(S) monitor every ~5–10 minutes
  against `https://<service>.onrender.com/actuator/health`.

**Docs:** Add `docs/beta/backend-hosting.md` (Neon create → Render service →
env checklist → Flyway note → keep-alive → how to promote a fix manually). Link
from README / soft-beta friends plan. Refresh planned stub notes already on
roadmap Environments.

**Contract:** none. Web/mobile clients unchanged in this PR (except they keep
working locally).

## Acceptance criteria

- [ ] Unauthenticated `GET /actuator/health` returns **200** with a body that
      does **not** include datasource credentials or env dumps
      (`show-details=never`).
- [ ] All other existing `/api/**` auth rules unchanged (register/login public;
      everything else authenticated).
- [ ] Local lane still works: Compose Postgres + `bootRun` with default
      `application.yaml` (no Render required to develop).
- [ ] Dockerfile builds a runnable image that starts the Boot jar and listens on
      `$PORT` (or 8080).
- [ ] Documented prod env checklist covers at least: Neon JDBC URL/user/pass,
      `GEMINI_API_KEY`, `PORT`, optional `APP_CORS_ALLOWED_ORIGINS`, optional
      illustration/R2 vars.
- [ ] `docs/beta/backend-hosting.md` describes: Neon + Render first deploy,
      Flyway-on-boot, UptimeRobot keep-alive URL, and “how to ship a hotfix”
      (merge `main` → manual redeploy) until `ci-cd-production`.
- [ ] CORS: localhost Vite origins still allowed; additional origins from
      `APP_CORS_ALLOWED_ORIGINS` are honored when set.
- [ ] No secrets (Neon passwords, Gemini keys, Render tokens) committed; `.env`
      / example env stay gitignored or use placeholders only.
- [ ] Tests: security allows anonymous health; health endpoint returns 200;
      CORS/origin helper (or config) covered for an extra origin without
      breaking localhost.

## Tasks

- [ ] Backend: add Actuator dependency; configure health-only exposure +
      `show-details=never`; permit `/actuator/health` in
      `AccountsSecurityConfig`.
- [ ] Backend: bind `server.port` to `${PORT:8080}`; document Spring datasource
      env overrides for Neon (no hardcoded prod URLs in yaml).
- [ ] Backend: make CORS origins configurable via `APP_CORS_ALLOWED_ORIGINS`
      (plus existing localhost list).
- [ ] Infra: root Dockerfile (multi-stage JDK 25 → JRE 25 `bootJar`).
- [ ] Infra (optional): thin `render.yaml` if it reduces dashboard churn without
      inventing auto-deploy.
- [ ] Docs: `docs/beta/backend-hosting.md` + README / soft-beta plan links.
- [ ] Contract: **none** (no OpenAPI change).
- [ ] Web / iOS: **none** in this PR (web origin wired in `beta-web-hosting`).
- [ ] Tests: Actuator health anonymous 200; auth still enforced on a sample
      protected route; CORS allowed-origins include configured extra origin.

## Open questions

- **Render free-tier sleep:** Accept cold starts between UptimeRobot pings;
  monitor interval chosen to balance wake vs free-tier limits (document the
  chosen interval in the beta doc).
- **Neon project region:** Pick closest to Render region at implement time;
  record in the beta doc (not a code decision).
- **First deploy is human-in-the-loop:** Creating Neon/Render/UptimeRobot
  accounts and pasting secrets is part of “done” for the operator, even though
  code+docs land via PR — implementer runs through the checklist once on the
  real accounts (or pairs with you) before calling the slice shipped.
