# Spec: suggestion-pacing-evidence

Status: done  
Created: 2026-07-25  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-25 · re-rank split  
Specced: 2026-08-03  
Branch: `suggestion-pacing-evidence`

## Problem

Suggest already computes a `paceHint` (`pull_back` / `gentle_stretch` /
`steady`) and a short `rationale`, but neither the LLM prompt nor the heuristic
is grounded in a curated, calm evidence pack — and parents never see *why this
pace* beyond a single free sentence. Without that, suggestions feel arbitrary
and risk inventing clinical-sounding claims.

## Non-goals

- Richer browseable citation library / many tagged snippets
  (`pacing-citation-library` — parked for later)
- Insights tips catalog changes or Insights UI for pacing evidence
- Welcome / product tour copy (`welcome-orientation`)
- Changing invent / adjacent-food rules (`suggestion-adjacent-foods`)
- Stretch-target nomination (`stretch-food-targets`)
- Prep rotation for disliked foods (`disliked-prep-rotation`)
- Clinical instruments, ARFID diagnosis, therapist-grade scoring
- Live web research / fetching papers at runtime
- Auto-owned calendar (`app-driven-schedule`)
- Native iOS / Android Plan Suggest UI (DTO sync only)
- Replacing parent Approve / invent materialization

## Approach

### Locked product rules

1. **Curated static pack (in-repo):** A small set of calm pacing principles
   keyed by existing `paceHint` values. Each entry has: parent-facing
   `pacingNote` (one short calm sentence), optional short `citations` (title +
   plain-language source label — not DOI dump), and internal prompt bullets for
   the LLM. Claims stay parent-led and non-clinical (“gentle repeated exposure
   often helps” — not diagnoses or treatment plans).
2. **Engine wiring:** Both AI Suggest and heuristic fallback select the pack
   entry for the brief’s `paceHint` and use it for:
   - Gemini prompt context (structured evidence bullets + “do not invent clinical
     claims”)
   - Heuristic `rationale` may stay food-oriented; **parent evidence** comes from
     the pack’s `pacingNote` / `citations` (do not stuff citations into
     `rationale`)
3. **Parent-facing on Suggest:** Web Plan Suggest panel shows a distinct “why
   this pace” line (`pacingNote`) and, when present, a short citation list
   under the existing rationale. No new Plan create fields.
4. **Contract:** Extend `SessionSuggestionResponse` with optional
   `pacingNote` (string, nullable) and `citations` (array of
   `{ title, source }`, may be empty). OpenAPI version bump; sync **web +
   mobile** sharedLogic DTOs (no native Plan UI).

### Shape

- Sessions module: static pack + selector by `paceHint`; attach to suggestion
  response for both AI and heuristic paths; Modulith / `ModularityTests` pass.
- No new public foods API; no DB migration (pack is code/resources).
- Web: Suggest draft panel only.
- Tests: pack selection unit tests; suggestion service / IT asserts pacing
  fields for each hint; web Plan component test for display; OpenAPI contract
  test.

## Acceptance criteria

- [x] Suggest (AI and heuristic) returns `pacingNote` (and optional `citations`)
      matching the household’s computed `paceHint` from a curated static pack.
- [x] Gemini prompt includes the pack’s evidence bullets for that `paceHint` and
      instructs not to invent clinical claims; invent/adjacent rules unchanged.
- [x] Heuristic path also populates `pacingNote` / `citations` (not AI-only).
- [x] Web Plan Suggest panel shows pacing note distinctly from `rationale`, plus
      short citations when present; Dismiss / Approve behavior unchanged.
- [x] OpenAPI documents the new fields; version bump; web + mobile DTOs synced.
- [x] Pack content is calm, parent-led, and non-diagnostic (reviewable in PR).
- [x] Unit + IT + ModularityTests; web component coverage for Suggest display.
- [x] No Insights / welcome / invent / stretch-target / native Plan UI changes.

## Tasks

- [x] Backend: curated pacing pack + select by `paceHint`; wire into Gemini
      prompt and heuristic Suggest response; unit tests.
- [x] Contract: `pacingNote` + `citations` on `SessionSuggestionResponse`;
      version bump; web + mobile DTO sync.
- [x] Web: Suggest panel pacing note + citations display; component tests.
- [x] Backend IT: Suggest returns pack fields for pull_back / gentle_stretch /
      steady; ModularityTests.
- [x] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Surface: engine pack **and** light parent-facing line on Suggest (not
  Insights-only).
- Contract: extend Suggest response (not fold into `rationale` only).
- Pack v1: curated static in-repo; richer library parked as
  `pacing-citation-library`.

Accepted risk:

- Citations are plain-language source labels, not a peer-reviewed bibliography.
- Pack size stays small (~one entry per `paceHint`); expanding tags/snippets is
  deferred to `pacing-citation-library`.
