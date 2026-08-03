# Spec: familiarity-from-outcomes

Status: done  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · re-rank split  
Specced: 2026-08-03  
Branch: `familiarity-from-outcomes`

## Problem

Safe presentations should usually stay safe, but the designed path is: try
adjacent / stretch presentations → hope some become new safes; if a **food +
variant** is tried and does not land, it should enter the personal pipeline as
**retrying** (not vanish or stay forever “truly new”). Completing a run should
upsert the matching **exposure profile** from each session slot’s outcome —
without taking judgment away from the parent (especially never auto-clearing
`safe`).

## Non-goals

- Manual Foods / Plan autofill persist model (`household-exposure-profiles` —
  already shipped)
- Signup bootstrap (`signup-safe-foods` — already shipped)
- Changing reward unlock rules beyond what familiarity already implies
- Clinical scoring or forced multi-try promotion to safe (v1: one good try →
  safe)
- Backfilling exposures from historical completed sessions before this ships
- Suggestion shortlist / adjacent invent (`suggestion-adjacent-foods`)
- Science pacing pack (`suggestion-pacing-evidence`)
- Stretch target queue (`stretch-food-targets`)
- Native Run / Foods UI changes (web complete path + backend; mobile DTOs only
  if contract/response fields change)
- Auto-demoting `safe` from outcomes (parent clears/changes on Foods only)

## Approach

### Locked outcome → exposure rules (v1)

On successful `POST …/sessions/{id}/complete`, for **each** of the two foods:

Key = `(foodId, normalize(variantNote))` using the same trim + case-fold rules
as exposures today (`""` when blank).

1. **Never auto-downgrade `safe`.** If an existing exposure for that key is
   already `safe`, leave `familiarity=safe`. Still refresh attempt hooks and set
   `source=outcome` when writing the row (or leave source as-is if we only bump
   hooks — prefer updating `source=outcome` only when familiarity also changes;
   always bump hooks). Document: familiarity stays `safe`; hooks update.
2. **Positive try** — `liked=like` **and** `ateEnough=true` → upsert
   `familiarity=safe`, `source=outcome` (unless already safe — then hooks only /
   same end state).
3. **Didn’t land** — `liked=no`, **or** `liked=so_so`, **or** `ateEnough=false`
   (including `liked=like` with `ateEnough=false`) → if current familiarity is
   **not** `safe`, upsert `familiarity=retrying`, `source=outcome`. If current
   is `safe`, keep `safe` (rule 1).
4. **Hooks** (columns already on `household_food_exposures`): always on
   complete for that key:
   - `attempt_count` = coalesce(existing, 0) + 1
   - `last_tried_on` = session’s calendar date (same zone policy as Plan/Run —
     prefer the session `scheduledOn` date)
   - `last_liked` = outcome `liked` string (or null if liked omitted — treat as
     required today on complete; store the value sent)

`liked=null` should not happen on a valid complete (existing validation); if it
does, treat as didn’t-land for familiarity (conservative).

### Modulith boundary

- **Do not** import foods `internal` from sessions.
- Prefer: sessions publishes a Spring application event after successful
  complete (e.g. `SessionCompletedEvent` with householdId, sessionId,
  scheduledOn, and per-food foodId + variantNote + liked + ateEnough).
- Foods module `@EventListener` / `@TransactionalEventListener` applies the
  upsert rules above.
- Public foods API for manual upsert stays `source=manual`; bootstrap stays
  `signup`; this path writes `outcome`.

### Contract / surfaces

- OpenAPI: document that complete updates exposures; if `FoodExposureResponse`
  gains optional hook fields (`attemptCount`, `lastTriedOn`, `lastLiked`), bump
  version and sync web + mobile clients. If hooks stay internal-only this PR,
  say so in AC and skip client field churn — prefer **exposing hooks** on
  exposure responses so Foods/Plan can show “last tried” later without another
  contract pass.
- Web: no new parent-facing settings UI required; complete already runs from
  Run. Optional: Known safes / exposure list shows `source=outcome` or last
  tried if cheap.
- Mobile: sharedLogic only if response DTOs change; no native UI.

### Why not call foods from SessionService directly

Keeps Modulith clean and matches AGENTS.md (events across modules). First
cross-module event in this app is acceptable for this slice.

## Acceptance criteria

- [x] Completing a session with a positive try (`liked=like` + `ateEnough=true`)
      upserts exposure `(foodId, normalized variant)` → `safe` / `outcome`
      (new or overwrite non-safe).
- [x] Completing with didn’t-land (`liked=no` | `so_so` | `ateEnough=false`)
      upserts `retrying` / `outcome` when the prior familiarity was not `safe`.
- [x] An existing `safe` exposure is **not** changed to `retrying` (or any
      non-safe) by outcomes; hooks still update.
- [x] Variant normalization matches existing exposure rules (trim + case-fold;
      blank → `""`).
- [x] Both food positions are processed on one complete.
- [x] Cross-module: sessions does not depend on foods `internal`; foods applies
      updates via application event (or equivalent Modulith-safe boundary).
      `ModularityTests` pass.
- [x] Unauthenticated complete still **401**; other households unaffected.
- [x] OpenAPI + clients updated if exposure response gains hook fields; version
      bump in the same change.
- [x] Unit + IT: positive → safe; didn’t-land → retrying; safe preserved on
      bad outcome; attempt_count increments. Web test only if UI surfaces
      change; otherwise backend coverage is enough for the sync path.
- [x] No reward-rule changes; no backfill of old sessions; no suggestion changes.

## Tasks

- [x] Backend sessions: publish `SessionCompletedEvent` (or equivalent) after
      successful complete with per-food outcome payload.
- [x] Backend foods: listen and apply locked upsert rules + hooks; unit tests.
- [x] Backend IT: complete session → assert exposures / sources / safe
      preservation; `ModularityTests`.
- [x] Contract: document outcome source behavior; optional exposure hook fields
      + version bump; sync web + mobile if fields added.
- [x] Web: only if exposing hooks/source in Foods UI; otherwise skip.
- [x] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- v1 rules locked 2026-08-03: never auto-downgrade safe; like+ateEnough → safe;
  no / so_so / !ateEnough → retrying (if not safe); bump attempt hooks.

Accepted risk:

- First Spring application event across modules — keep payload small and stable.
- Completing again on the same session is already blocked; re-runs of the same
  food+variant on later nights keep incrementing attempts (desired).
- so_so counts as didn’t-land for familiarity (conservative); parents can still
  mark safe manually on Foods.
