# Spec: plan-occupied-dates

Status: done  
Created: 2026-07-28  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement  
Specced: 2026-07-28  
Completed: 2026-07-29

## Problem

Plan’s date field is a native `<input type="date">`. Past days are blocked via
`min`, but days that already have a planned or completed session still look
open until save fails with “A session already exists on that date.” Parents
should see occupied nights as unavailable in the calendar—the same calm clarity
past dates already have—especially now that Suggest also proposes a date.

## Non-goals

- Changing server one-session-per-day rules (planned/completed occupy; cancelled
  does not) — already shipped in `session-plan-guards`
- OpenAPI / backend API changes
- Native iOS / Android Plan UI
- Printable wall calendar (`printable-plan-calendar`)
- Multi-month agenda, range pick, or scheduling across households
- Replacing Upcoming list with a calendar-only Plan page (picker only)

## Approach

**Locked**

- **Web Plan only:** Replace create/edit and Suggest date `<input type="date">`
  with a **month calendar** date picker so past and occupied days can be
  visually disabled (greyed / non-selectable), matching the product ask.
- **Dependency:** Add **`react-day-picker`** (shadcn Calendar stack; solid
  a11y + `disabled` matchers). Wrap a thin `Calendar` / `PlanDatePicker` under
  `web/src/components/ui/` or `web/src/components/plan/` in existing Tailwind /
  button styles—no second date library. Confirm artifact in the first
  `/implement` task when adding to `package.json`.
- **Occupied =** any upcoming session already loaded for Plan whose
  `scheduledOn` matches that calendar day (same set the page already uses for
  client-side “day taken” checks). On **edit**, the session being edited’s own
  date stays selectable. Cancelled nights are not in the upcoming list, so they
  stay free (aligned with backend).
- **Past days** remain disabled (before local today / existing `todayIso` /
  `minDate` behavior).
- **No contract change:** create/update/suggest still send `scheduledOn` ISO
  dates; server 409 remains the backstop.
- **UX:** Inline month grid (or popover anchored to a date button—prefer
  inline in the Plan/Suggest form so iPad laptop Plan stays glanceable). Show
  selected date in plain language; keep keyboard/focus usable.

## Acceptance criteria

- [x] Plan create and edit forms use a calendar month picker (not a bare
      native date input) for `scheduledOn`.
- [x] Suggest next night draft uses the same picker for its suggested date.
- [x] Days before local today are visually disabled and cannot be selected
      (parity with prior `min` behavior).
- [x] Days that already have a planned session in the loaded Upcoming list are
      visually disabled and cannot be selected.
- [x] When editing a night, that session’s current `scheduledOn` remains
      selectable even though it appears in Upcoming.
- [x] Selecting an available day updates the draft/form `scheduledOn` ISO value
      used by existing create/update/approve flows.
- [x] Save/Approve still obey existing client guards; server 409 remains if a
      race occupies the day.
- [x] Component tests cover: occupied day not selectable; past day not
      selectable; edit keeps own day selectable; Suggest panel uses the picker.
- [x] No OpenAPI / backend / native Plan changes in this PR.

## Tasks

- [x] Web: add `react-day-picker`; thin Calendar/PlanDatePicker; wire Plan
      create/edit + Suggest date; disable past + occupied (edit exception).
- [x] Tests: PlanPage (and/or PlanDatePicker) coverage for disabled/selectable
      cases above.

## Decisions (locked)

- Calendar month UX over native date input for this slice.
- New dep: `react-day-picker` only (shadcn-style wrapper), ask confirmed.
- Occupied = upcoming planned sessions already on the page; no new API.
- Edit mode: current session’s date stays enabled.

## Open questions

- _(none — inline vs popover layout can be chosen at implement if both meet AC)_
