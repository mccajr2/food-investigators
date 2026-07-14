# Spec: family-account

Status: draft  
Created: 2026-07-11  
Parent: [docs/roadmap.md](../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

Parent uses a laptop (web) and an iPad for tasting nights. There is no way to
sign in or own a shared household, so later features (foods, sessions, history)
cannot sync across devices. The repo still ships the disposable `greeting`
harness and has no auth or persistence stack — both should be replaced by this
first real product slice.

## Non-goals

- Forgot / reset password (explicitly deferred)
- Email verification, magic links, social login / SSO
- Child-only login or PIN unlock (parent signs in on the iPad)
- Multiple households per user, invites, or roles beyond “parent”
- Android-specific auth UI (sharedLogic client yes; wire native Android screens later)
- Full production email delivery, MFA, or account deletion flows
- Broader identity rename (`com.yourorg.quickapp` → product package) — separate
  cleanup unless it blocks auth

## Approach

Add a Spring Modulith **`accounts`** module (vertical slice) that owns parent
identity and a household. **Remove the `greeting` harness in the same PR** —
this is the first real vertical slice, so the cross-stack smoke path becomes
auth (register/login/me) instead of greeting. That matches
`docs/using-as-template.md` (“delete greeting after first real feature”).

- **Persistence:** Introduce app-level Postgres (dev/prod via local Docker
  Postgres) — first time this repo gets a database. Integration tests use
  **Testcontainers Postgres**, not H2. Schema via Flyway (or equivalent already
  preferred in-repo if one appears). Confirm dependency versions in
  `gradle/libs.versions.toml` before adding; do not invent unlisted libraries
  without asking.
- **Auth:** Email + password. Passwords stored hashed (Spring Security password
  encoder). On register, create one **User** and one **Household** (1:1 for v1).
  Login issues a **server-side session token** returned as a Bearer token (so
  logout can invalidate the session and both web + iOS can use the same header).
- **Keep me logged in:** Login (and register-then-enter) UIs include a checkbox
  (default **checked** for a family app).  
  - **Checked:** longer-lived server session + persist token across browser
    reload / app restart (web `localStorage`; iOS Keychain).  
  - **Unchecked:** shorter-lived server session + do **not** persist across
    process death (web `sessionStorage` or memory; iOS memory / session-scoped
    store). Closing the browser tab/window or force-quitting the app ends the
    client session.
- **Contract:** Replace greeting in `contracts/openapi.yaml` with register,
  login, logout, and me. Update hand-written `web/src/api/` and mobile
  `sharedLogic` clients in the same change; delete greeting clients/UI.
- **Clients:** Web (React) register/sign-in/sign-out + keep-me-logged-in.
  iOS (SwiftUI) sign-in/sign-out + keep-me-logged-in via sharedLogic. Parent is
  the signed-in user on the iPad.
- **Security rules:** Auth endpoints public; `GET /api/auth/me` and future
  household APIs require a valid Bearer token. No public greeting endpoint after
  this PR.
- **Harness removal:** Delete `backend/modules/greeting/`, greeting tests, web
  harness greeting UI, mobile greeting client/UI wiring; point README smoke at
  auth.

If implementation shows this cannot fit one PR, split via `/roadmap` into an
API+DB slice and a clients slice — do not silently expand scope. Keep greeting
removal with whichever slice owns the OpenAPI cutover so the contract never
documents both forever.

## Acceptance criteria

- [ ] A new parent can **register** with email + password (web and via API) and
      receives a session token; a **household** is created for that account.
- [ ] An existing parent can **sign in** with email + password on **web** and
      **iOS** and receive a session token.
- [ ] Sign-in UI offers a **Keep me logged in** checkbox (default on).
- [ ] With **Keep me logged in checked**, web and iOS stay signed in across
      browser reload / app restart until sign-out.
- [ ] With **Keep me logged in unchecked**, the token is not restored after
      browser session end / app process end; user must sign in again.
- [ ] **Sign out** invalidates the server session; subsequent authenticated calls
      with that token fail (401).
- [ ] `GET /api/auth/me` with a valid token returns the current user’s id, email,
      and household id; without a token (or with a bad token) returns 401.
- [ ] Duplicate email on register returns a clear client error (e.g. 409), not a
      500.
- [ ] Wrong password / unknown email on login returns 401 without leaking which
      field failed.
- [ ] `contracts/openapi.yaml` documents auth endpoints only (no greeting path);
      web and mobile clients match the contract in the same change.
- [ ] Greeting harness is gone: no `greeting` backend module, no greeting API
      clients/UI on web or mobile; README smoke uses auth.
- [ ] Unit + integration tests cover register, login (both remember modes),
      logout, me, duplicate email, and unauthorized me; `ModularityTests` still
      passes.

## Tasks

- [ ] Backend: Add persistence + Flyway (or chosen migrator) and Spring Security
      wiring at the app level as needed for the `accounts` module (confirm deps
      in version catalog first).
- [ ] Backend: Create `backend/modules/accounts/` with register/login/logout/me,
      password hashing, household creation, session token store (TTL differs for
      remember vs not), and Modulith `internal` boundaries.
- [ ] Backend: Remove `backend/modules/greeting/` and its tests.
- [ ] Contract: Replace greeting with auth paths/schemas in
      `contracts/openapi.yaml` (product-oriented API title/description).
- [ ] Web: Remove greeting harness; auth API client + register/sign-in/sign-out
      + Keep me logged in; show minimal “signed in as …” shell (no tasting UI).
- [ ] iOS: Remove greeting UI/client usage; sharedLogic auth client + token
      storage honoring remember flag; SwiftUI sign-in/sign-out + Keep me logged
      in; show signed-in state (no tasting UI).
- [ ] Docs: Update README quick start / smoke to auth instead of greeting.
- [ ] Tests: Module unit tests + API integration tests for the AC above;
      sharedLogic client tests for auth calls; keep `ModularityTests` green.

## Decisions (locked)

- **Database:** Local Docker Postgres for `bootRun` / manual dev. Integration
  tests use **Testcontainers Postgres** (real Postgres, started by the test
  process). Do **not** use H2 for this slice.
- **Session TTLs:** Remember me = **30 days**; session-only (Keep me logged in
  unchecked) = **12 hours**. Document in code/config.
- **Register:** Email + password only for v1 — no display-name field.

## Open questions

_(none — ready for approval / `/implement`)_
