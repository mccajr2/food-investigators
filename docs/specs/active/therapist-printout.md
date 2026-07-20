# Spec: therapist-printout

Status: approved  

Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial

## Problem

Parents can browse completed tasting nights on History, but a doctor or food
therapist still needs a **shareable packet** — what was tried, answers, notes,
and outcomes — not a laptop login. Without a downloadable PDF, the parent has
no clean artifact to bring to an appointment.

## Non-goals

- Browser-only print / CSS `@media print` as the primary deliverable (optional
  later; this PR is **server PDF**)
- EHR integration or therapist portal accounts
- Printable upcoming schedule (`printable-plan-calendar` in parking)
- Child / household display name or other PII on the packet header
- Fancy branding over a clear chronological log
- Charts, trends, or “what worked” summaries (`pace-insights`)
- Extending `GET /api/sessions/history` with `from`/`to` (preview filters
  client-side)
- Native iOS/Android print UI
- Editing past outcomes

## Approach

Extend the Modulith **`sessions`** module and **web** History so a signed-in
parent can **download a PDF** of completed sessions (optionally date-filtered).

- **API (OpenAPI):** Add `GET /api/sessions/history.pdf` — household-scoped PDF
  of `status=completed` sessions, newest first (same order as history list).
  Optional query params `from` and `to` (ISO-8601 dates) filter inclusively on
  `scheduledOn`. Omit both → full completed history. Unauthenticated → 401.
  Response: `application/pdf` with a sensible `Content-Disposition` filename.
  Do **not** change `GET /api/sessions/history` query shape in this PR.
- **PDF content:** Header — generic title (“Food Investigators — tasting
  history”), generated-at date, and the applied range (or “All completed
  sessions”). Body — for each included session: date, both foods (name,
  familiarity, variant notes), and run outcomes (liked / texture / temperature /
  smell / whyNote / changeNote / ateEnough), showing blanks/dashes for nulls.
  Empty range → still a valid PDF with header + empty-state line (not 404).
- **PDF generation:** Implement in the sessions module. **Ask before adding**
  any new PDF library (none in the repo today).
- **Web:** On History — optional from/to date inputs; **client-side** filter of
  the already-loaded history list (preview). **Download PDF** calls the new
  endpoint with the same `from`/`to` (omit when cleared). Keep existing
  list + read-only detail behavior.
- **Mobile sharedLogic:** Client method to fetch the PDF bytes (contract
  alignment); no SwiftUI UI.

## Acceptance criteria

- [ ] Authenticated parent can **download a PDF** of completed sessions for
      their household (newest first); `planned` and `cancelled` are omitted.
- [ ] Omitting `from`/`to` includes **all** completed sessions; providing either
      or both filters inclusively on `scheduledOn`.
- [ ] PDF header is generic (product title + generated date + range label) —
      **no** parent email or household id.
- [ ] Each included session in the PDF shows both foods’ familiarity, variant
      notes, and outcomes (including nulls as blank/dash).
- [ ] Empty filtered set → **200** PDF with empty-state copy (not 404).
- [ ] Unauthenticated → 401; invalid date query → 400.
- [ ] Web History: from/to filter updates the on-screen list client-side;
      Download PDF uses the same range; clear filter restores full list /
      full-history download.
- [ ] `contracts/openapi.yaml` documents the PDF path + params; web and
      sharedLogic clients match in the same change.
- [ ] Unit + API integration + web History tests for filter/download;
      sharedLogic client tests; `ModularityTests` green.
- [ ] No native print UI; no change to upcoming Plan list behavior.

## Tasks

- [x] Backend: PDF export on sessions service/controller (`from`/`to` on
      `scheduledOn`); household scoping; empty-range PDF.
- [ ] Contract: Document `GET /api/sessions/history.pdf` in
      `contracts/openapi.yaml`.
- [ ] Web: History from/to filter (client-side) + Download PDF via sessions
      client.
- [ ] Mobile sharedLogic: PDF download method (no SwiftUI UI).
- [ ] Tests: Module unit + API integration + web History filter/download tests;
      sharedLogic client tests; keep `ModularityTests` green.

## Decisions (locked)

- **Server-generated PDF** (not browser print as primary).
- Full history **by default**; optional inclusive `from`/`to` on `scheduledOn`.
- Web **preview** = client-side filter of existing history list; only the PDF
  endpoint takes `from`/`to`.
- Packet header: **generic title only** (no email / child name).
- History JSON list API unchanged this PR.
- PDF library: **Apache PDFBox** 3.0.8.

## Open questions

_(none — ready for implementation)_
