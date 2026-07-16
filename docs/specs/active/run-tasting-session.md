# Spec: run-tasting-session

Status: approved  

Created: 2026-07-11  
Parent: [docs/roadmap.md](../roadmap.md)  
Added: 2026-07-11 · initial · 2026-07-15 · re-rank split (web first; native iOS deferred)

## Problem

Parents can plan tasting nights on the laptop, but cooking night still has no
guided ritual: the child cannot drive answers with big icons, “why” stays in the
parent’s head, and there is nothing durable for a future food therapist. Without
a run flow that works on *his* iPad without a paid Apple developer account, the
plan never becomes practice.

## Non-goals

- Native SwiftUI / App Store / Xcode-installed iPad app (`run-tasting-session-ios`)
- Android run UI
- Closed emoji-chip dictionary as the only “reminded of” path
- Browsing past sessions as a history product (`session-history`)
- Therapist printable packet (`therapist-printout`)
- Reward games (`reward-mini-games`)
- Offline / sync-later run (`offline-ipad-session`)
- Auto pace changes or app-suggested next foods
- Requiring every prompt to be answered (skips allowed on kid screens)

## Approach

Extend the existing Modulith **`sessions`** module and **web** client so a signed-in
parent can **run** a still-`planned` session in an **iPad-optimized web** UI
(Safari / Chrome; Add to Home Screen). Native iOS is a follow-up roadmap id.

- **Data / API (OpenAPI):** Persist per-food run outcomes and move the session to
  `completed` when finished. Outcomes for each of the two foods:
  - `liked`: `like` | `so_so` | `no` (nullable if skipped)
  - `texture`: `soft` | `crunchy` | `chewy` | `wet` (nullable if skipped)
  - `temperature`: `cold` | `warm` | `hot` (nullable if skipped)
  - `smell`: `mild` | `strong` (nullable if skipped)
  - `whyNote`: free text from mic/type (nullable if skipped; max length e.g. 500)
  - `changeNote`: free text — “what could we change…” (nullable; max 500)
  - `ateEnough`: boolean (parent; required to finish that food’s step)
  Reject runs on `cancelled` or already `completed` sessions (4xx). Upcoming list
  continues to omit non-`planned` sessions. Household scoping unchanged.
- **Web (iPad-first):** Full-bleed, one question at a time; **icons primary** with
  **large simple text labels** (reading practice). Flow per food, then food 2,
  then complete:
  1. Liked? — Like / So-so / No  
  2. Texture — Soft / Crunchy / Chewy / Wet  
  3. Temperature — Cold / Warm / Hot  
  4. Smell — Mild / Strong (skip OK)  
  5. Mic: “Why did you like it or not like it?” → transcript → parent confirms  
  6. Mic: “Is there something we could change…?” → transcript → parent confirms  
  7. Parent: Ate enough? — Yes / No  
  Kid screens support **Skip**. Mic uses browser speech recognition where
  available (`tap to talk` → show words → parent edit/confirm); always allow
  parent to type if mic unavailable (desktop/laptop testing, unsupported
  browser). Entry: from Plan upcoming list, **Run** opens the runner (usable on
  phone/desktop too, but layout targets iPad landscape/portrait).
- **Mobile sharedLogic:** Extend sessions client for outcome/complete endpoints
  (no SwiftUI run UI this PR).
- **Distribution:** Web only — no Apple $99 / 7-day sideload required for his
  device.

## Acceptance criteria

- [ ] Authenticated parent can open a **planned** session and complete the
      per-food icon + mic + ate-enough flow for both foods on an iPad-sized web
      viewport (icons primary, large labels).
- [ ] Kid screens support **Skip**; mic prompts support tap-to-talk → editable
      transcript → parent confirm, with parent **type** fallback when speech is
      unavailable.
- [ ] Saving outcomes persists liked / texture / temperature / smell / whyNote /
      changeNote / ateEnough per food; finishing both foods marks the session
      `completed` and it leaves the default upcoming list.
- [ ] Cannot run or mutate outcomes for `cancelled` or already `completed`
      sessions (4xx); unauthenticated → 401; other household → 404.
- [ ] `contracts/openapi.yaml` documents run/outcome/complete shapes; web and
      sharedLogic clients match in the same change.
- [ ] Unit + API integration + web component tests; sharedLogic client tests;
      `ModularityTests` green.
- [ ] No native iOS/Android run UI in this PR.

## Tasks

- [ ] Backend: Persist food outcomes + `completed` status; run/complete (or
      equivalent) endpoints with household scoping and status guards.
- [ ] Contract: Document outcome fields and run/complete paths in
      `contracts/openapi.yaml`.
- [ ] Web: iPad-optimized session runner (icon steps, two mic prompts, ate
      enough, skip); **Run** from Plan upcoming; wire client to new API.
- [ ] Mobile sharedLogic: Sessions client methods for outcomes/complete (no
      SwiftUI run UI).
- [ ] Tests: Module unit + API integration + web runner component tests;
      sharedLogic client tests; keep `ModularityTests` green.

## Decisions (locked)

- **Web iPad-optimized first**; native SwiftUI deferred to
  `run-tasting-session-ios` (no $99 / 7-day reinstall for daily use).
- Icons primary + large simple text labels; one question per screen.
- Prompt set: Liked, Texture, Temperature, Smell (optional), two mic “why /
  what could change”, parent Ate enough.
- Mic: tap to talk → show words → parent confirms; type fallback always.
- Skips allowed on kid screens; ritual must not stall.
- No closed chip-only “reminded of” dictionary in this PR.

## Open questions

_(none — ready for approval)_
