# Spec: signup-safe-foods

Status: in-progress  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · re-rank split  
Specced: 2026-08-03  
Branch: `signup-safe-foods`

## Problem

New households start with a generic system catalog and **no personal safe
baseline**. Parents should be **nudged** at Create account to name a reasonable
starting list — about **5 safe tasting foods** (session-eligible) plus **optional
snacks** — so Plan autofill, Insights, and later suggestions start from this
child’s reality. Copy should explain that these safe foods help with **planning
sessions**. Named foods may be **new to the system** — inventing household rows
must work; matching an existing system starter when the name lines up should
also be easy via typeahead.

## Non-goals

- Hard-blocking Create account until N foods are filled (nudge + Skip allowed;
  empty list still registers)
- Multi-child intake
- Replacing or hiding the global system starter library
- Auto-updating exposures from completed runs (`familiarity-from-outcomes`)
- Adjacent / beyond-catalog suggestions (`suggestion-adjacent-foods`)
- Native iOS/Android Create-account UI (mobile sharedLogic DTOs/clients only)
- Full Plan typeahead product (`plan-food-autocomplete` stays separate)
- Public unauthenticated food catalog endpoint (not required if matching is
  name-based server-side)
- Collecting full snack prefs (liked/texture/taste note) at signup — snack flag
  only; prefs can be edited later on Foods

## Approach

### Locked product

- **Safe foods** section on web Create account (alongside email / password /
  child name / remember-me), framed as a helpful start — not a wall.
- **Nudge layout (default):**
  - Short blurb: safe foods he already eats help the app **plan tasting
    sessions** (what to pair, pace, and suggest next).
  - **~5 tasting-food slots** pre-shown (empty name fields) as the prompt for a
    starting list; parent can fill any number of them, add more up to the cap,
    or clear/Skip.
  - **Optional snacks:** separate lighter control (“Add a snack”) — preferred
    non-mealtime foods that also count as safe; not required to get started.
- Soft target: **about 5 tasting safes**; snacks optional extras. Hard API max
  **10** total items (tasting + snacks combined).
- Each tasting/snack row: **food name** (required if that row is submitted),
  optional **brand/prep variant**; snacks set `sessionEligible: false`.
- Name field: **free text** with **optional typeahead** suggesting system
  starter display names. Picking a suggestion fills the name; inventing a novel
  name is always allowed.
- **Skip** (or submit with all empty tasting slots) still creates the account —
  same as today’s catalog-only start.
- On successful register, web calls an authenticated bootstrap endpoint with
  non-empty rows only (`source=signup` on exposures).

### Locked API / backend

- **Do not** teach the accounts module to create foods (Modulith). Prefer:
  1. `POST /api/auth/register` unchanged for account creation, then
  2. Authenticated `POST /api/foods/bootstrap-safes` (or equivalent name) in the
     **foods** module that accepts the list and creates foods + safe exposures.
- Request item shape (illustrative):
  `{ "name": "Bagel", "variantKey": "Bagelsaurus", "sessionEligible": true }`
  - `variantKey` optional / blank → empty exposure key.
  - `sessionEligible` default `true`; `false` = snack (prefs may stay unset).
- **Server match rule:** case-insensitive name match against a **visible system
  starter** → upsert exposure `safe` / `signup` on that `food_id` (no duplicate
  household row). Else create household food + upsert `(foodId, variantKey)` →
  `safe` / `signup`.
- Cap **10** items per call (**400** if more). Allow **0** items (no-op **200**
  or skip call from client).
- Duplicate names in one request (same normalized name + variant): reject
  **400** with a clear message.
- OpenAPI bump; web auth + foods clients; mobile sharedLogic register/bootstrap
  DTOs (native signup UI not required).

### Why not fold safes into RegisterRequest body

Accounts must not import foods internals. A post-register foods bootstrap keeps
boundaries clean and reuses the new session token. Web UX can still feel like
one Create account form (collect fields → register → bootstrap → enter app).

## Acceptance criteria

- [ ] Web Create account shows a Safe foods nudge with copy that safe foods help
      **plan tasting sessions**, **~5 empty tasting-food slots** as the default
      prompt, and an **optional snacks** affordance (add snack rows).
- [ ] Parent can fill any subset of the tasting slots, add more (up to API max),
      or **Skip** / leave empty; account still creates.
- [ ] Name field supports free text and optional typeahead of system starter
      names; novel names are accepted.
- [ ] After successful register, web calls bootstrap with **non-empty** rows only;
      zero filled rows → **skip** the bootstrap call.
- [ ] `POST /api/foods/bootstrap-safes` (auth required): for each item, match
      system starter by case-insensitive name **or** create household food; upsert
      safe exposure with `source=signup`; snacks set `sessionEligible=false`.
- [ ] More than 10 items → **400**. Unauthenticated → **401**.
- [ ] Matching a system starter does **not** create a duplicate household food
      with the same name.
- [ ] Invented names appear under Foods (tasting or Snacks) with a safe exposure
      visible in Known safes / Plan autofill.
- [ ] OpenAPI + web + mobile sharedLogic clients updated in the same change.
- [ ] Unit + API/IT + web Create-account tests (incl. nudge copy / 5 tasting
      slots / Skip); `ModularityTests` pass.
- [ ] No native signup UI; no outcome sync; no suggestion shortlist changes;
      no hard minimum count gate on register.

## Tasks

- [ ] Backend: `bootstrap-safes` (or equivalent) on foods module — match-or-create
      + safe exposure `signup`; validation (max 10, blank names); unit + IT.
- [ ] Contract: OpenAPI schemas/paths; bump version; sync web + mobile clients.
- [ ] Web: Create account Safe foods nudge (~5 tasting slots + optional snacks +
      session-planning copy + typeahead) → register → bootstrap.
- [ ] Mobile: sharedLogic DTOs/client for bootstrap (and register only if touched);
      no native UI required.
- [ ] Tests: foods unit/IT; web AuthShell/register nudge + Skip; modularity.
- [ ] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Invent + **optional typeahead that can match** system starters (user lock
  2026-08-03).
- **Nudge** for ~5 tasting safes + optional snacks, with planning-session copy;
  still skippable (user 2026-08-03).
- Soft target ~5 tasting; hard max 10 total on API.

Accepted risk:

- Typeahead suggestion list may be driven by the web’s known starter name set
  (aligned with catalog seeds), with **server** authoritative for match-or-create.
- Two-request register→bootstrap is not a single DB transaction across modules;
  if bootstrap fails after register, show a clear error and leave the account
  usable (parent can finish on Foods). Document that UX in implementation.
