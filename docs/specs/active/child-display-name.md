# Spec: child-display-name

Status: draft  
Created: 2026-07-28  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement  
Branch: `child-display-name`

## Problem

The product talks about “he” / the child but never stores a name. Parents should
optionally set a child’s **first name** at signup (and edit it later) so Plan,
Run, and celebration copy can feel personal — still **one** child per household.
Without this, the ritual stays generic and `multi-child-profiles` stays blocked
on identity basics.

## Non-goals

- Multiple kids (`multi-child-profiles` — parked); this PR does **not** invent a
  children table or per-session child picker
- Legal / school name, DOB, pronouns UI, or any PII beyond a short display first name
- Avatar / photo profiles
- Putting the child’s name on therapist PDF / History packet headers (stay
  household-anonymous for shareables)
- Logging, analytics, or LLM prompts that include the child’s name (not needed
  for this slice; keep display-name out of Suggest briefs and server logs)
- Native iOS settings UI beyond sharedLogic model sync
- Renaming every string in the app — only high-visibility Plan / Run /
  celebration (and signed-in chrome) in this PR; Insights tips may stay generic

## Approach

**Household-scoped optional display first name** on `households` for the
**single-child beta**. Exposed through auth/me and an update path. Web register
can collect it optionally; signed-in parents can edit it in a small
settings/profile control. When blank, UI keeps today’s generic “your child” /
existing copy.

### Forward-looking (not in this PR)

**Multi-child later (`multi-child-profiles`):** treat this column as the
household’s **current / primary** display name for copy, not a permanent
“the only child forever” model. When multi-child lands, expect a `children`
(or similar) table with per-child display names; migrate
`households.child_display_name` into the first child row (or drop it after
backfill). Keep API field names and web copy helpers **indirection-friendly**
(e.g. read “active child display name” from household profile today so callers
don’t hard-code “there is only one kid forever” in every screen). Do **not**
attach tasting sessions to a child id in this PR.

**Privacy / kid-name data later:** display first name is mild PII. This slice
already keeps it off therapist PDF / History shareables. Going forward:
- Prefer **display-only** use in parent-facing UI; do not put the name in
  exported packets, public URLs, or Suggest/LLM briefs unless a later spec
  explicitly allows it.
- Prefer not writing the name into application logs or error messages.
- Clearing the name (`null`) must be first-class (already in AC) so parents can
  remove it without deleting the account.
- Future retention/export/delete-account work should treat `child_display_name`
  (and later child rows) as household personal data.

### Data & API (OpenAPI)

- Add nullable `child_display_name` (varchar, short — e.g. max 40) on
  `households` via Flyway. Document in migration comment that multi-child may
  later move this to a children table.
- Expose as `childDisplayName` on `UserResponse` (`GET /api/auth/me`, register /
  login payloads that return `user`).
- Optional on `RegisterRequest`; blank/omit → null.
- Update via authenticated `PATCH /api/auth/me` (or equivalent household
  profile patch) with `{ "childDisplayName": "…" | null }` — clearing allowed.
- Validate: trim; empty → null; reject overly long / control characters; no
  uniqueness requirement.

### Web

- Register: optional “Child’s first name” field.
- Signed-in: edit + clear in AuthShell (or a tiny Account settings strip).
- Helper that formats copy with the name when set (e.g. “Alex’s tasting night”)
  vs generic fallback; wire into Plan heading/empty hints, Run intro/encourage
  strings, and reward celebration chrome — not therapist PDF.

### Mobile

- sharedLogic: parse/send `childDisplayName` on auth models; no full settings UI
  required this PR.

## Acceptance criteria

- [ ] Household may store an optional `childDisplayName` (null when unset).
- [ ] Register with a name persists it; register without leaves null; `/me` and
      auth responses return the current value.
- [ ] Authenticated parent can update or clear the name; other households cannot
      see or change it.
- [ ] Invalid values (too long / blank-only after trim handled as clear) return a
      clear 4xx — not 500.
- [ ] Web: optional name on Create account; signed-in edit/clear works.
- [ ] Web: when set, at least Plan, Run, and celebration/encourage surfaces use
      the name; when null, existing generic copy remains.
- [ ] Therapist PDF / History shareable header still has **no** child name.
- [ ] Child display name is not included in Suggest/LLM request briefs or
      routine application log lines for auth/food/session flows touched here.
- [ ] OpenAPI + web + mobile clients updated in the same change.
- [ ] Tests: Flyway/service unit + auth IT; web register/settings + one copy
      helper/surface test; mobile client parse/send.

## Tasks

- [ ] Backend: Flyway `child_display_name` on `households`; register + `/me` +
      update; validation; unit + integration tests.
- [ ] Contract: OpenAPI `childDisplayName` on `UserResponse` / register /
      update; bump consumers checklist.
- [ ] Web: types + auth client; register field; signed-in edit; copy helper;
      Plan/Run/celebration wiring; tests.
- [ ] Mobile: sharedLogic auth models + client tests (UI optional/minimal).
- [ ] Docs: on ship, archive this spec; Next up becomes next roadmap rank
      (`signup-starter-snacks` unless re-ranked).

## Open questions

- Exact max length (propose **40** graphemes/chars) — confirm at implement if
  product wants shorter.
- Prefer `PATCH /api/auth/me` vs dedicated `/api/household` — default **auth/me**
  to avoid a new module surface; amend if accounts boundary feels wrong.

## Decisions (locked for this PR)

- Single optional name on `households` for beta; multi-child migrates later.
- Shareables (therapist PDF / History headers) stay nameless.
- Display-only in parent UI; out of Suggest briefs and routine logs this slice.
