# Spec: food-catalog

Status: done  
Created: 2026-07-11  
Completed: 2026-07-14  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

Parents need a reusable list of foods with large, simple icons before they can
plan tasting sessions. Without a starter library scoped around this child’s
current safe foods (plus gentle near-options), every session would start from a
blank name field. Household-specific additions and soft-archive are required so
the therapist-facing history can keep referencing foods that were later hidden.

## Non-goals

- Nutrition facts, recipes, or grocery integration
- Uploaded photos or AI-generated icons (client-side emoji/initials from the
  name cover unknowns; starter SVGs stay a fixed set)
- Familiarity / pace tracking UI (later slices)
- iPad catalog management UI (web only; sharedLogic API client only)
- Hard-delete of foods (archive only)
- Editing or archiving **starter/system** foods
- Android catalog UI

## Approach

Add a Spring Modulith **`foods`** module with household-scoped custom foods and
a global starter library.

- **Data:** One `foods` table: `id`, `name`, `icon_key`, `household_id` (NULL =
  system starter), `archived_at` (NULL = active), `created_at` / `updated_at`.
  System rows are seeded via Flyway and are read-only via the API.
- **Icons:** Starter foods use fixed allowlisted `iconKey` values mapped to SVG
  assets on web. Household foods may reuse those keys **or** store
  `custom_<slug>` derived from the food name; the web client renders customs
  (emoji from a keyword map when known, otherwise initials). No uploads / AI.
- **API (authenticated):** list (system + this household; optional
  `includeArchived`), create household food, update name/icon, archive
  (set `archived_at`). Reuse Bearer sessions from `accounts`.
- **Web:** Signed-in Foods page after auth: browse starter (large icons) + My
  foods; add/edit form defaults to “from name” icon generation, with optional
  starter icon picker; archive action. No iPad manage UI.
- **Mobile:** `sharedLogic` client matching OpenAPI; no SwiftUI catalog screen.

## Starter library (seed)

| Name | iconKey | Notes |
|------|---------|--------|
| Bagel and cream cheese | `bagel_cream_cheese` | Go-to |
| Instant ramen | `ramen` | Go-to |
| Chicken tenders | `chicken_tenders` | Go-to |
| Apples | `apple` | Go-to |
| Strawberries | `strawberry` | Go-to |
| Chocolate chip pancakes | `pancakes_choc_chip` | Go-to |
| Plain yogurt | `yogurt_plain` | Go-to |
| Bagel | `bagel` | Gentle ring |
| Toast | `toast` | Gentle ring |
| Chicken nuggets | `chicken_nuggets` | Gentle ring |
| Applesauce | `applesauce` | Gentle ring |
| Banana | `banana` | Gentle ring |
| Blueberries | `blueberry` | Gentle ring |
| Grapes | `grape` | Gentle ring |
| Plain pancakes | `pancakes_plain` | Gentle ring |
| Waffle | `waffle` | Gentle ring |
| Vanilla yogurt | `yogurt_vanilla` | Gentle ring |
| Carrot | `carrot` | Sweeter veggie |
| Corn | `corn` | Sweeter veggie |
| Sweet potato | `sweet_potato` | Sweeter veggie |

Icon allowlist above = starter illustrations. Household foods may use those keys
or `custom_<slug>` (see Decisions).

## Acceptance criteria

- [x] Authenticated parent can **list** foods: all system starters + this
      household’s non-archived foods by default; `includeArchived=true` includes
      archived household foods.
- [x] Authenticated parent can **create** a household food with name + `iconKey`
      (starter allowlist **or** `custom_<slug>`); response includes id and
      householdId.
- [x] Authenticated parent can **update** name and/or icon of their household food.
- [x] Authenticated parent can **archive** a household food; it disappears from
      the default list but remains available with `includeArchived=true`.
- [x] System starter foods cannot be updated or archived (4xx).
- [x] Unauthenticated requests to food endpoints return 401.
- [x] Invalid `iconKey` on create/update returns 400.
- [x] Web (signed in): Foods page shows starter + My foods with large icons;
      add defaults to icon-from-name (optional starter picker); edit/archive work
      end-to-end.
- [x] Keep me logged in / session still works; Foods is only reachable when signed
      in (redirect or gate to auth).
- [x] `contracts/openapi.yaml` documents the foods endpoints; web and sharedLogic
      clients match in the same change.
- [x] Unit + integration tests cover list/create/update/archive and system
      immutability; `ModularityTests` passes.
- [x] No iPad catalog management UI in this PR.

## Tasks

- [x] Backend: Flyway migration for `foods` + seed starter rows; icon-key
      allowlist shared with validation.
- [x] Backend: `foods` Modulith module — list/create/update/archive endpoints,
      household scoping, system immutability.
- [x] Contract: Add foods paths/schemas to `contracts/openapi.yaml`.
- [x] Web: Foods API client + Foods page (list, add/edit with icon picker,
      archive); gate behind signed-in shell.
- [x] Mobile sharedLogic: Foods client matching OpenAPI (no SwiftUI catalog UI).
- [x] Tests: Module unit + API integration + web component tests; sharedLogic
      client tests; keep `ModularityTests` green.

## Decisions (locked)

- Web manages catalog; iPad sessions consume API later — no catalog UI on iOS now.
- Starter foods use a fixed `iconKey` illustration set. Household foods may use
  those keys **or** `custom_<slug>` generated from the name (client renders
  emoji-from-text or initials — no uploads / AI).
- Add / edit / archive (soft); no hard delete.
- Starter = go-tos + gentle ring + carrot / corn / sweet potato.

## Open questions

_(none)_
