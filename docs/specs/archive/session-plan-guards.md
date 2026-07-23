# Spec: session-plan-guards

Status: done  
Created: 2026-07-22  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-22 · enhancement

## Problem

Parents can still plan tasting sessions on past dates and stack multiple sessions
on the same calendar day, which muddies ritual cadence and history. Plan create
(and date changes on edit) should reject those cases with clear feedback — while
still allowing brand/prep comparisons that reuse one catalog food when each slot
has a distinct `variantNote` (e.g. Bagelsaurus vs Iggy’s).

## Non-goals

- App-owned calendars or suggested schedules (`app-driven-schedule`,
  `suggested-next-session`)
- Changing foods-per-session (stays exactly two)
- Time-of-day scheduling (date-only stays)
- Forbidding same-`foodId` pairs that have **different** non-blank variants
- Migrating or rewriting historical sessions that already violate the new rules
- Run / complete / outcome validation
- Parent notes (`session-parent-notes`)
- Native iOS Plan UI

## Approach

Enforce the same rules on **backend create/update** and **web Plan** UI.

**Past dates**

- `scheduledOn` must be **today or later** in the household’s calendar sense —
  use the server’s `LocalDate.now(clock)` (injectable `Clock` for tests) and the
  browser’s local “today” for the date input `min`.
- Past → **400** with a clear message (e.g. “Scheduled date can’t be in the
  past”).

**One session per calendar day (household)**

- **Create:** reject if another session for this household already exists on that
  `scheduledOn` with status **`planned` or `completed`**.
- **Update:** only `planned` sessions remain editable (existing rule). When
  changing `scheduledOn`, reject if **another** planned/completed session
  already occupies the target day (exclude the session being edited). Staying on
  the same day is fine.
- **Cancelled** does **not** occupy the day — create/update may reuse that date.
- Conflict → **409** with a clear message (e.g. “A session already exists on that
  date”). Prefer a dedicated exception over overloading “Session cannot be
  edited”.

**Same food, different variants**

- If both slots share the same `foodId`, each must have a non-blank `variantNote`
  (trim; blank → null as today), and the two notes must **differ**
  case-insensitively after trim.
- Otherwise → **400** (e.g. “Same food needs two different brand/variety notes”
  or “Pick two different foods”).
- Different `foodId`s: variants optional as today (no new requirement).

**Contract / layers**

- OpenAPI: document new 400/409 cases on create/update; tighten 409 text so it
  covers completed (not only cancelled) for editability.
- Web: date input `min={today}` so past days are **not selectable / grayed out**
  in the picker (no need to save to discover that error). Surface API messages
  for day conflict and same-food/variant rules; optionally warn before submit
  when the day looks taken — backend remains source of truth. When both slots
  pick the same food, require distinct variant fields in the UI (and still trust
  the backend).
- No DB unique index required if status-aware (cancelled must not block); query
  existing planned/completed for `(householdId, scheduledOn)` excluding self on
  update.

**Also in this PR (docs/consistency only)**

- Align OpenAPI 409 description for non-editable sessions with behavior
  (planned-only edit/cancel; completed and cancelled both blocked).

## Acceptance criteria

- [x] Create with `scheduledOn` before today returns **400**; today and future
      succeed (other fields valid).
- [x] Update of a **planned** session to a past `scheduledOn` returns **400**.
- [x] Create on a date that already has a **planned** or **completed** session
      for the household returns **409**; a date with only a **cancelled** session
      (or no session) succeeds.
- [x] Update that **moves** a planned session onto another session’s
      planned/completed date returns **409**; update that keeps the same date
      (or moves onto a free / cancelled-only date) succeeds.
- [x] Completed sessions still cannot be updated (existing **409** editability).
- [x] Same `foodId` + two different non-blank `variantNote`s is accepted.
- [x] Same `foodId` with either variant missing/blank, or with matching variants
      (trim, case-insensitive), returns **400**.
- [x] Two different `foodId`s still work with empty variants.
- [x] Web Plan date picker sets `min` to today so past dates are grayed out /
      unselectable before save; create/update errors for day conflict and
      same-food/variant rules (and any past-date bypass) show clear copy.
- [x] OpenAPI documents the new validation responses; web client stays aligned.
- [x] Session unit + API integration tests and PlanPage tests cover the cases
      above.

## Tasks

- [x] Backend: Past-date + one-per-day (planned/completed) + same-food/variant
      pair checks on create/update; dedicated conflict exception/handler;
      injectable clock; unit tests.
- [x] Contract: OpenAPI 400/409 docs for create/update; fix non-editable 409
      description; align web types/client if needed.
- [x] Web: Plan date `min`; same-food UI requires distinct variants; surface
      validation errors.
- [x] Tests: API integration for past / day conflict / cancelled frees day /
      same-food variant rules; PlanPage coverage for `min` + errors.

## Decisions (locked)

- **Today allowed;** only past dates rejected.
- **Day occupancy:** `planned` or `completed` blocks create (and blocks update
  onto that day for a different session). **Cancelled frees the day.**
- **Editability unchanged:** only `planned` sessions can be updated; completed
  cannot.
- **Same `foodId` both slots:** allowed **only if** both `variantNote`s are
  non-blank and differ (trim, case-insensitive). Otherwise rejected.
- **No historical backfill** of old past-dated or multi-per-day rows.

## Open questions

_(none)_
