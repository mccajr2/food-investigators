# Spec: why-insights-surface

Status: draft  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-30 · re-rank split  
Specced: 2026-07-30  
Depends on: [why-outcome-depth](../archive/why-outcome-depth.md) (chip-encoded `whyNote`)

## Problem

Completed nights now often carry kid-language why text in `whyNote`, but Insights
never uses it. Parents still have to dig through History to see patterns in
**why he liked it / didn’t** — so therapy and pacing decisions miss an easy
signal on the Insights screen.

## Non-goals

- Replacing or redesigning History / therapist PDF why rows
- Clinical NLP, sentiment models, or open-ended clustering of free text
- Changing Run capture UX or chip lists (`why-outcome-depth`) beyond reading
  the same v1 chip label strings for counting
- Native Insights UI (mobile client types only so the contract stays aligned)
- Raising Insights readiness threshold or redesigning the whole Insights page

## Approach

**Locked — both tips and snippets in one PR**

1. **Recent why snippets (contract + UI)**  
   Extend `InsightsResponse` with `recentWhyNotes`: up to **5** newest
   completed-food outcomes that have a non-null non-blank `whyNote`, newest
   session/food first. Each item: `scheduledOn`, `foodName`, `liked` (nullable),
   `whyNote`. Shown on web Insights as a short “Recent whys” section (always
   when `ready`, even if empty — empty copy: no why notes yet).

2. **Why-based tips (same tips list)**  
   Backend keeps the v1 chip label lists (same strings as web `whyChips`).
   Count how often each known chip label appears as a **substring** of
   `whyNote` among completed foods with `liked === like` vs `liked === no`
   (case-insensitive). When Insights is `ready`:
   - If a **like** chip appears in ≥ **2** like-why notes → tip
     `lean_into_why_like` naming that chip (e.g. likes often mention crunchy).
   - If a **no** chip appears in ≥ **2** dislike-why notes → tip
     `notice_why_dislike` naming that chip.
   - At most one tip of each id; pick the chip with the highest count (tie:
     stable chip-list order). Dismissible like other tips; add ids to
     `KNOWN_TIP_IDS`. Still respect `MAX_TIPS = 3` (why tips compete with
     existing tips via the same selection order — insert after taste lean-in,
     before celebrate / mix / keep-going).

3. **Layers**  
   Backend `InsightsCalculator` + OpenAPI + web Insights page + web/mobile
   Insights clients + tests. No Run changes.

## Acceptance criteria

- [ ] OpenAPI `InsightsResponse` includes `recentWhyNotes` (array of
      `scheduledOn`, `foodName`, `liked`, `whyNote`); web + mobile clients
      updated in the same change.
- [ ] When Insights is ready, API returns up to 5 recent non-blank why notes
      (newest first) from completed sessions.
- [ ] Web Insights shows a “Recent whys” section listing those snippets (food,
      date, liked, why text); empty state when the list is empty.
- [ ] When a like chip label appears in ≥2 like `whyNote`s, a dismissible
      `lean_into_why_like` tip is eligible (message names the chip).
- [ ] When a no chip label appears in ≥2 dislike `whyNote`s, a dismissible
      `notice_why_dislike` tip is eligible (message names the chip).
- [ ] Why tip ids are dismissible and listed in known tip ids (unknown id still
      404 on dismiss).
- [ ] No Run / History / PDF changes; no NLP beyond substring chip matching.
- [ ] Unit tests for calculator (snippets order/limit; tip thresholds/ties);
      web Insights component coverage for section + tip; OpenAPI contract test /
      client tests as usual for this repo.

## Tasks

- [ ] Backend: Aggregate recent whys + chip counts; emit snippets + why tips.
- [ ] Contract: OpenAPI schemas; regenerate/update as this repo expects.
- [ ] Web: Insights client types + “Recent whys” UI (+ tip messages render).
- [ ] Mobile: `InsightsResponse` / client parse for `recentWhyNotes`.
- [ ] Tests: Calculator + InsightsPage + client/contract coverage above.

## Decisions (locked)

- Both tips **and** snippets in this PR (user chose option 3).
- Match v1 chip labels as substrings; no free-text NLP.
- Snippet cap 5; tip threshold 2 mentions; max one tip per why tip id.

## Open questions

- _(none)_
