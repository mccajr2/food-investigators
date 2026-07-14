# Food Investigators / quickapp

Full-stack starter layout (backend, mobile, web, OpenAPI) with a living product
roadmap. Auth (family account) is the current cross-stack smoke path.

| Layer | Stack |
|-------|--------|
| Backend | Java 25, Spring Boot 4.1, Spring Modulith (vertical modules) |
| Mobile | Kotlin Multiplatform — shared logic, Android (Compose) + iOS (SwiftUI) |
| Web | Vite + React + TypeScript + Tailwind (shadcn-style UI) |
| Contract | OpenAPI (`contracts/openapi.yaml`) |
| Workflow | `/roadmap` → `/spec` → `/implement` → `/pr` → merge |

## Quick start (auth smoke test)

Postgres is required for the backend. From the repo root:

```bash
docker compose up -d postgres

# Backend — leave running
./gradlew :backend:bootRun
```

Register a parent account and confirm `/me`:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@example.com","password":"password1","rememberMe":true}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s "http://localhost:8080/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

Success returns JSON with `email` and `householdId` (proves persistence + auth).

**Web** (sign in / create account UI):

```bash
cd web
npm ci                 # Node >=20 locally; CI uses web/.nvmrc + packageManager
npm run dev
```

Open the app, create an account (Keep me logged in on by default), and confirm
“Signed in as …”.

**iOS:** open `mobile/iosApp/iosApp.xcodeproj` in Xcode → run on a simulator →
sign in with the same API (backend must be reachable; simulator uses
`http://localhost:8080`).

**Android:** open `mobile/` in Android Studio → run `androidApp` (auth UI is on
iOS for this slice; sharedLogic still builds).

## Docs

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](AGENTS.md) | Constitution for humans and coding agents |
| [docs/using-as-template.md](docs/using-as-template.md) | Template → new app, rename checklist |
| [docs/roadmap.md](docs/roadmap.md) | Product backlog — carve-up, re-rank, Next up |
| [docs/architecture.md](docs/architecture.md) | SDD workflow, module patterns, how to add features |
| [docs/specs/](docs/specs/) | Planned stubs, active, and archived feature specs |
| [contracts/openapi.yaml](contracts/openapi.yaml) | API source of truth |

## Tests

```bash
# Backend (needs Docker for Testcontainers Postgres)
./gradlew :backend:test

# Mobile (from mobile/) — needs Android SDK installed; local.properties is
# auto-generated from ANDROID_HOME or the default SDK path (see docs/using-as-template.md)
cd mobile
./gradlew :sharedLogic:testAndroidHostTest :androidApp:assembleDebug

# Web (from web/)
cd web
npm test
```

## Status

Backend Modulith + Postgres/Flyway auth (`accounts`), KMP sharedLogic auth
client, React web auth shell, iOS SwiftUI auth shell, path-filtered CI, and
`/roadmap` workflow. `main` is PR-protected.
