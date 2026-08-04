# Spec: stretch-food-targets

Status: in-progress  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · enhancement  
Specced: 2026-08-03 · re-rank split (C-lite; pathway deferred)  
Branch: `stretch-food-targets`

## Problem

Parents often know a stretch food they want to try someday (e.g. ground beef
while the child already loves taco-night sides) but don’t want to force it onto
tonight’s Plan. Without a durable stretch-target queue, that goal stays in the
parent’s head. Without **goal-directed** Suggest, invent/adjacent picks can
wander into a different flavor or texture profile instead of intermediate steps
toward that destination. Pace must stay parent-led (Suggest→Approve), but the
app should be in charge of *when* a stretch (or a step toward it) is a calm
next try.

## Non-goals

- Explicit multi-week intermediate ladder, path progress UI, or stricter
  destination readiness (`stretch-pathway` — next Upcoming after this slice)
- Auto-creating calendar sessions without parent Approve (`app-driven-schedule`)
- Replacing therapist judgment or clinical treatment planning
- System inventing stretch *destinations* from scratch (adjacent invent without
  a parent-nominated target remains `suggestion-adjacent-foods`)
- Prep rotation for disliked foods (`disliked-prep-rotation`)
- Richer citation library (`pacing-citation-library`)
- Welcome / product tour copy (`welcome-orientation`)
- Native iOS / Android Foods or Plan Suggest UI (DTO sync only if contract
  changes touch shared clients)
- Changing Run ritual, reward unlock rules, or Insights tips catalog
- Multi-child stretch queues (`multi-child-profiles`)

## Approach

### Locked product rules

1. **Foods owns the queue; Plan only surfaces via Suggest→Approve.** Parents
   add/remove stretch targets on the Foods page (alongside safes/exposures).
   Plan does not get a second nomination CRUD UI.
2. **Target = food + presentation.** Same exposure keying as the rest of the
   product (`foodId` + `variantKey`, blank variant allowed). Nomination may
   pick an existing tasting food **or invent** a name (materialize food on
   nominate using the same invent spirit as signup/bootstrap — not on Suggest
   alone). Invented targets are **not** marked safe by default.
3. **Parent-led nights:** Suggest → review/swap → Approve or Dismiss. Never
   auto-schedule a stretch night.
4. **C-lite goal-directed Suggest (this PR):** When the household has ≥1 active
   stretch target and `paceHint` is not `pull_back`:
   - Prefer the stretch **slot** (at most one invent / non-safe) to be an
     **intermediate** toward a nominated target, grounded in current **safe**
     exposures + the target’s name/variant (e.g. taco-adjacent steps toward
     ground beef) — not a random other profile.
   - Propose the **target itself** only when a simple readiness gate passes:
     not `pull_back`; household has a usable safe anchor for the other slot;
     that food+variant was not recently hard-rejected (liked=`no` in a recent
     completed outcome) / is not in an active cool-down from a failed try.
   - On `pull_back`: do not propose the destination; keep invents gentle /
     familiar (existing adjacent rules without forcing the target).
5. **Queue hygiene:** Parent can remove a target anytime. Soft cap on active
   targets (e.g. ≤5) so Suggest stays focused. Completing a session that
   includes a destination does **not** auto-delete it in v1 (parent clears
   when the goal is done); Suggest still applies cool-down so it isn’t
   hammered night after night.
6. **Contract:** New household stretch-target CRUD under foods (list / add /
   remove). Suggest brief consumes active targets (sessions reads via foods
   **public** API / Modulith-safe boundary — no `internal` imports). OpenAPI
   version bump; sync web + mobile sharedLogic DTOs.
7. **Layers:** foods module (persist + API) + sessions Suggest wiring + web
   Foods UI; Plan Approve/invent path unchanged aside from consuming drafts
   that may be path-biased.

### Shape

- DB: household stretch-target rows keyed by household + food + variantKey
  (unique active target per key).
- Web Foods: “Stretch targets” section — list, add (autocomplete existing +
  invent name/variant), remove.
- Suggest: include targets in Gemini prompt + heuristic bias; keep at-most-one
  invent and safe-anchor composition from `suggestion-adjacent-foods`.
- Tests: foods unit/IT for CRUD; suggestion unit/IT for path bias + pull_back /
  cool-down gates; web Foods component tests; ModularityTests; OpenAPI
  contract test.

## Acceptance criteria

- [ ] Parent can add and remove stretch targets (food + variant; invent OK) on
      the Foods page; targets persist per household.
- [ ] Active stretch targets appear in the Suggest brief; on non-`pull_back`
      paces, Suggest prefers path-shaped intermediates toward a target over
      unrelated invents when inventing/stretching.
- [ ] Suggest may propose the nominated **destination** only when the simple
      readiness gate passes; never on `pull_back`; never auto-schedule without
      Approve.
- [ ] Existing Suggest composition preserved: exactly two foods, at most one
      invent, other slot safe when inventing; Approve materialization unchanged.
- [ ] Soft cap on active targets enforced by API; remove works; completing a
      session does not silently delete the target (cool-down still applies).
- [ ] OpenAPI documents stretch-target endpoints + any Suggest brief fields
      needed; version bump; web + mobile DTOs synced.
- [ ] Unit + IT + ModularityTests; web Foods coverage for queue UI.
- [ ] No Plan nomination CRUD, no `stretch-pathway` ladder UI, no native Foods
      UI, no Run/Insights tip catalog changes.

## Tasks

- [ ] Backend (foods): persist stretch targets; list/add/remove API; invent-on-
      nominate; soft cap; unit + IT.
- [ ] Backend (sessions): load active targets into Suggest brief; Gemini +
      heuristic C-lite path bias + destination readiness / pull_back / cool-down;
      unit + IT; ModularityTests.
- [ ] Contract: OpenAPI stretch-target paths/schemas (+ Suggest fields if any);
      version bump; web + mobile DTO sync.
- [ ] Web: Foods stretch-target section (list/add/remove); client wiring;
      component tests.
- [ ] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Nomination home: **Foods CRUD**; Plan only via Suggest→Approve.
- Product intent: goal-directed path (**C**); this PR is **C-lite**; fuller
  ladder is **`stretch-pathway`** (Upcoming rank after this id).
- Parent-led Approve; invent OK on nominate; destinations not auto-safe.

Accepted risk:

- “Intermediate toward target” in v1 is LLM/heuristic bias from safes + target
  text — not a persisted step graph (that’s `stretch-pathway`).
- Soft cool-down / recent-reject rules are intentionally simple; may tune after
  beta feedback.
