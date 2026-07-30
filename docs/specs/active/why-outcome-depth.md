# Spec: why-outcome-depth

Status: draft  
Created: 2026-07-28  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement  
Specced: 2026-07-30  
Split: Insights surfacing → `why-insights-surface` (2026-07-30 · re-rank split)

## Problem

Run already asks why differently for like / dislike / so-so, but the answer is
easy to skip and free-text-only. Parents need reliable, kid-language signal on
**why he liked it and why he didn’t** for therapy and later suggestions —
without turning the step into an essay.

## Non-goals

- Insights tips / aggregates / why snippets (`why-insights-surface` — next)
- Full sense-survey reshape (`run-sense-survey`)
- Clinical coding or NLP of free text
- Requiring essays or blocking Skip forever
- New OpenAPI fields (chips fold into existing `whyNote`)
- Changing History/PDF layout beyond whatever `whyNote` already displays
- Native iOS Run (`run-tasting-session-ios`)
- Changing `changeNote` / parent notes

## Approach

**Locked**

- **Why step UI (web Run):** Keep liked-specific prompt. Add **multi-select
  chips** (kid language) that vary by `liked` (`like` / `no` / `so_so`), plus
  the existing optional mic/type short note.
- **Persist:** No contract change. Encode selection into `whyNote` (max 500):
  selected chip labels joined with `", "`; if a trimmed note is present, append
  `" — "` + note. Empty chips + empty note → `null` (Skip).
- **Continue:** Enabled when ≥1 chip **or** a non-empty note. Skip still
  available (sets `whyNote` null) — chips make Skip less necessary, not banned.
- **Chip sets (v1, fixed copy in web):** Small closed lists (~5–7 each), e.g.
  - like: tasty, crunchy, soft, yummy smell, looks good, warm, cold  
  - no: yucky taste, too crunchy, too soft, yucky smell, looks weird, too hot,
    too cold  
  - so_so: kind of tasty, weird texture, okay smell, looks okay, not sure  
  Exact strings locked in implementation to match tests; tweak only if UX review
  asks before merge.
- **Layers:** Web Run (`SpeechNoteStep` / why step + helpers) + unit/component
  tests. No backend / OpenAPI / Insights / iOS.

## Acceptance criteria

- [ ] Why step shows multi-select chips appropriate to the current food’s
      `liked` value (like / no / so_so).
- [ ] Parent can select multiple chips and/or enter an optional short note
      (mic/type as today).
- [ ] Continue is enabled only when ≥1 chip is selected or the note is
      non-empty; Skip remains and stores `whyNote: null`.
- [ ] Completing with chips only persists `whyNote` as the joined chip labels
      (comma-separated).
- [ ] Completing with chips + note persists
      `"chip1, chip2 — note text"` (same separator rules).
- [ ] Completing with note only (no chips) persists the trimmed note.
- [ ] No OpenAPI / backend / Insights / iOS changes.
- [ ] Tests cover encoding helper + Run why step: chip sets by liked, continue
      gating, Skip → null, complete payload shape.

## Tasks

- [ ] Web: Why-step chips UI + encode into `whyNote` on confirm (shared helper).
- [ ] Tests: Encoding helper + RunSessionPage / step coverage for the ACs above.

## Decisions (locked)

- Capture only this PR; Insights immediately after as `why-insights-surface`.
- Chips + optional note; fold into existing `whyNote` (no new API fields).
- Skip still allowed.

## Open questions

- _(none)_
