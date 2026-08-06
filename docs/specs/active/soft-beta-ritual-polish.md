# Spec: soft-beta-ritual-polish

Status: in-progress  
Created: 2026-08-04  
Added: 2026-08-04 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

Soft-beta families will abandon on hard nights before the product idea is wrong:
Suggest→Approve still feels like homework, Run Exit can silently throw away a
partially filled night, Insights tips don’t send parents back to Suggest,
History still shows demoted temperature/smell as “Skipped,” and two-stretch
nights are too long without coaching toward safe+stretch. Hosting is live and
Suggest now respects safe exposures (#58); this UX gate is the remaining invite
blocker per the 2026-08-05 readiness re-review.

Also: after a night is **completed today**, Plan’s calendar still treats today as
free (occupied dates come from upcoming/planned only), so parents only learn
the conflict on save — and early-run still offers “Record as today and run.”

## Non-goals

- **Run Exit soft-save / partial persist** (parked as `run-exit-soft-save`) —
  this PR is **warn-only**; Exit still discards if the parent confirms leave
- New mini-game engines or Mario-like platformers
- Stretch-target pathway depth (`stretch-pathway`)
- Changing Suggest algorithms / OpenAPI suggestion payloads
- Native iOS Run
- AuthShell structural split (`authshell-split`)
- Full product tour (`product-tour`)
- Removing temperature/smell from the OpenAPI contract (`run-outcome-contract`)
- Auto-approve without any Approve control (parent still confirms)
- Changing backend day-occupancy rules (planned + completed already conflict
  on create/update); this slice is **web UX** so the calendar and early-run
  match that rule before save

## Approach

One **web-first** soft-beta UX gate (plus History PDF cleanup). **No OpenAPI
changes** in this slice (prefer reusing existing History/upcoming data for
occupied dates).

1. **Safe+stretch coaching (Plan)** — Short note near Suggest / draft slots
   encouraging one **safe** (or familiar) food and one **stretch**
   (familiar-but-new / truly new / retrying). Use familiarity already on the
   draft; do not change backend Suggest.

2. **One-tap Approve when draft untouched (Plan)** — On Suggest response,
   snapshot the draft. If the parent has not edited date/slots/familiarity/
   variants, Approve is a single clear primary action (compact summary +
   prominent Approve; minimize re-teaching the full form). If they edit, keep
   today’s full editable form. Untouched = deep-equal to the snapshot.

3. **Run Exit warn (web only)** — If any outcome field for either food has been
   filled (liked, ate enough, why, tastes, etc.), show a confirm dialog before
   Exit: leaving discards tonight’s answers. No `beforeunload` required for v1
   unless cheap; no partial save API.

4. **Insights → Suggest CTA** — On Insights tips (or page chrome), a button
   like “Plan a suggested night” that switches AuthShell to Plan and optionally
   triggers Suggest (or focuses the Suggest control). Wire via callback props
   (`onGoToPlan` / `onSuggestNext`); no new routes.

5. **Hide demoted History fields** — In History detail, omit Temperature and
   Smell rows when null (do not show “Skipped”). Same for therapist PDF lines
   in `HistoryPdfRenderer` when null. Leave OpenAPI fields nullable.

6. **Occupied calendar + early-run guard (bugfix)** — Treat **planned and
   completed** nights as occupying their `scheduledOn` for Plan/Suggest date
   pickers (gray/disabled). If today already has a completed (or planned)
   night, **do not** offer early-run “Record as today and run” for a future
   planned night — surface a clear message instead (no update call that fails).

**Contract:** none. **iOS:** none (web Run only for soft beta).

## Acceptance criteria

- [ ] Plan shows safe+stretch coaching copy visible during Suggest / draft
      review (familiarity-aware; not a second Suggest call).
- [ ] After Suggest, if the draft is **untouched**, parent can Approve with one
      primary Approve action without re-editing fields; edited drafts keep full
      edit UI.
- [ ] Run Exit with any in-progress outcome data shows a confirm that warns
      answers will be lost; cancel keeps the run; confirm exits and discards
      (session remains planned).
- [ ] Run Exit with no outcome data filled exits without a dialog (or with a
      no-op cheap path — document in implement).
- [ ] Insights has a CTA that navigates to Plan (and can start Suggest or land
      on the Suggest control).
- [ ] History UI does not show Temperature/Smell as “Skipped” when null (rows
      omitted).
- [ ] Therapist PDF omits Temperature/Smell lines when null (no `-` placeholders
      for those two).
- [ ] After a session is **completed today**, Plan/Suggest calendars show today
      as occupied (disabled/gray); parent cannot pick today for a new plan
      without hitting a late API error.
- [ ] When today is already occupied (planned or completed), clicking **Run** on
      a **future** planned night does **not** open the early-run confirm that
      snaps to today; parent gets a clear reason (today already has a night).
- [ ] No OpenAPI version bump; web tests cover coaching, untouched Approve,
      Exit confirm, Insights CTA, History omission, occupied-today calendar +
      early-run block.
- [ ] Local + hosted web lanes unchanged aside from these UX behaviors.

## Tasks

- [ ] Web: Plan safe+stretch coaching UI + test.
- [ ] Web: Suggest draft snapshot + untouched one-tap Approve UX + test.
- [ ] Web: Run Exit confirm when outcomes dirty + test.
- [ ] Web: Insights → Plan/Suggest CTA + AuthShell wiring + test.
- [ ] Web: History hide null temperature/smell + test.
- [ ] Web: Occupied dates include completed nights; early-run blocked when
      today occupied + tests.
- [ ] Backend: History PDF omit null temperature/smell + test.
- [ ] Contract: **none**.
- [ ] iOS: **none**.

## Open questions

- **Exact coaching copy** — keep calm, non-clinical; iterate in PR review
  without a second spec.
- **Auto-fire Suggest from Insights CTA** vs navigate-only — prefer navigate +
  optional auto-Suggest if Plan can do it without surprising side effects;
  decide in implement (document in PR).
- **Soft-save** deferred to parking `run-exit-soft-save` if nights still get
  lost after warn-only ships.
- **How to load completed dates** — prefer existing History list (or a narrow
  date-range call) over a new OpenAPI endpoint; confirm in implement.
