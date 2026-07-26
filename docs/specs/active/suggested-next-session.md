# Spec: suggested-next-session

Status: in-progress  
Created: 2026-07-11  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-11 · initial  
Specced: 2026-07-25  
Split: 2026-07-25 · `suggestion-pacing-evidence` carved out (re-rank split)

## Problem

Parents still hand-pick every night’s two foods and familiarity levels. After
enough history, the app should **propose** a next session so planning stays
calm and informed by preferences, trouble spots, and pacing — while the parent
always **approves or swaps** before anything is cooked. Heuristics alone won’t
learn well enough over time; **AI is the primary proposer**, with a rule-based
fallback when data is thin or the model fails.

## Non-goals

- Science-backed pacing evidence library / citations
  (`suggestion-pacing-evidence` — next Upcoming slice)
- Fully app-owned calendar the parent must follow (`app-driven-schedule`)
- Hiding override / swap controls
- Auto-creating planned sessions without Approve
- Native iOS / Android Plan or suggestion UI
- AI skins for reward games (`ai-game-variants`)
- Inferring snack tastes (`snack-taste-ai`)
- Changing run survey, History, PDF, or Insights tip catalog (except reading
  their data as suggestion context)
- Multi-child profiles; more or fewer than two foods per night

## Approach

**Locked**

- **UX (web Plan):** “Suggest next night” → draft proposal panel (date + two
  foods + familiarity + optional short rationale). Parent can **swap** either
  food (catalog picker) and change familiarity / date, then **Approve**
  (creates a normal `planned` session via existing create rules/guards) or
  **Dismiss**. No silent writes.
- **API:** New authenticated suggestion endpoint(s) returning a draft proposal
  (not a persisted session). Approve uses existing create session API (or a
  thin accept that delegates to the same validation). OpenAPI + web + mobile
  sharedLogic clients in the same PR; no native Plan UI.
- **Local brief + shortlist (not a raw history dump):** Before any LLM call,
  the server builds a **bounded suggestion brief** from existing session /
  Insights-style aggregates (liked / texture / taste tops, familiarity mix,
  truly-new trouble rate, ate-enough, recent outcomes summary) plus a
  **candidate shortlist** of session-eligible catalog foods (e.g. on the order
  of ~8–20 ids with name/iconKey/familiarity hints — not tried lately, safe
  anchors, gentle stretches / retries). Do **not** send every historical
  session row as nights accumulate. No custom-trained ML model in this PR —
  deterministic feature aggregation only (embeddings / rankers later if needed).
- **AI primary (Gemini Flash):** Backend calls **Google Gemini Flash** via an
  OpenAI-compatible or official client (env API key; never commit secrets) with
  structured output: choose exactly two foods **from the shortlist only**,
  familiarity per slot, optional `scheduledOn` (default: next UTC calendar day
  without a planned session), optional calm rationale. Prompt gets the brief +
  shortlist — not free-form clinical advice. Invalid / off-shortlist food ids
  → reject and run fallback.
- **Heuristic fallback:** Used when completed-session count is below Insights
  ready threshold (< 3), AI is unconfigured / times out / returns invalid
  food ids, or structured parse fails. Fallback picks two distinct foods from
  the same shortlist logic with conservative familiarity (prefer `safe` /
  `familiar_but_new`; avoid stacking `truly_new` when history shows trouble).
  Response includes `source`: `ai` | `heuristic`.
- **Provider / dependency:** First AI wiring in this repo — add the Gemini /
  HTTP client dependency only at `/implement` after a quick confirm of artifact
  choice. Deterministic unit tests mock the LLM port (never call the network
  in CI).
- **Evidence:** Prompt may include light calm pacing language; full
  science-backed evidence pack waits for `suggestion-pacing-evidence`.

**Shape**

- Sessions module: brief/shortlist builder + suggestion service + LLM port +
  heuristic; Modulith boundaries / `ModularityTests` still pass.
- Web Plan: proposal panel with swap + Approve/Dismiss.
- Tests: brief/shortlist unit coverage, heuristic path, AI success (mocked),
  AI failure→fallback, approve creates session, swap validation, 401 scoping.

## Acceptance criteria

- [ ] Authenticated parent can request a next-session **proposal** (not yet a
      session); response includes exactly two catalog foods, familiarity each,
      a `scheduledOn`, optional rationale, and `source` of `ai` or `heuristic`.
- [ ] When Insights-ready history exists and AI is configured, happy path uses
      **AI** (`source=ai`) choosing two foods **from the server shortlist**
      only; off-list or unknown ids are rejected and **fallback** runs
      (`source=heuristic`).
- [ ] Suggestion context sent to the LLM is a **bounded brief + shortlist**,
      not the full growing session history; unit tests lock that the prompt
      payload stays within an agreed size budget (e.g. shortlist ≤ 20 foods).
- [ ] When < 3 completed sessions, AI unconfigured, timeout, or parse
      failure → heuristic proposal still returns **200** with `source=heuristic`
      (not a hard failure for the parent).
- [ ] Web Plan: Suggest → review/swap foods & familiarity & date → **Approve**
      creates a normal planned session obeying existing plan guards (past dates,
      one planned session per day, same-food variant rules); **Dismiss** creates
      nothing.
- [ ] Unauthenticated suggestion/create → **401**; other households’ foods /
      sessions never appear.
- [ ] OpenAPI + web + mobile sharedLogic clients aligned; unit + API + web
      tests cover AI mock success, fallback, approve, and swap; `ModularityTests`
      pass.
- [ ] No native Plan/suggestion UI; run/History/Insights/PDF unchanged except
      as read-only context for suggestions.

## Tasks

- [x] Backend: brief/shortlist builder + suggestion endpoint + Gemini Flash
      LLM port (mocked in tests) + heuristic fallback; wire approve to existing
      session create validation.
- [x] Contract: OpenAPI proposal schemas/paths; align web + mobile clients.
- [x] Web: Plan Suggest panel (swap, Approve, Dismiss) end-to-end.
- [ ] Tests: API IT (ai/heuristic/401/scoping) + PlanPage suggestion flow.

## Decisions (locked)

- Propose → Approve/swap (not “fill form only”).
- **Local brief + candidate shortlist**, then **Gemini Flash** chooses among
  the shortlist; **heuristic** when cold-start / error / unconfigured.
- No custom-trained ML or full history dumps to the model this PR.
- Science evidence pack deferred to `suggestion-pacing-evidence`.
- Parent always decides; Approve creates a normal planned session.
- Web laptop Plan only this PR.
- Gemini via JDK `HttpClient` + Jackson 3 (no Gemini SDK). Env:
  `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.0-flash`),
  `GEMINI_API_BASE_URL`. Config: `app.gemini.*`. Shortlist cap **20**.
  Rationale shown when non-empty.

## Open questions

- _(none — Gemini client/env, rationale, and shortlist cap locked in Decisions)_
