# Spec: run-survey-shorten

Status: done  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-28 · enhancement (as `run-sense-survey`)  
Renamed: 2026-07-30 · `run-sense-survey` → `run-survey-shorten`  
Specced: 2026-07-30  
Depends on: [why-outcome-depth](../archive/why-outcome-depth.md) (why chips); [reward-skip-safe](../archive/reward-skip-safe.md) (stretch = non-safe)
Completed: 2026-07-30

## Problem

The Run survey is a long checklist (~8 steps × 2 foods). A 5–6 year old cannot
mostly drive it independently, and several questions double-ask the same ideas
(texture/smell/temp vs why chips) or collect fields Insights never uses
(`temperature`, structured `smell`, kid `changeNote`). Parents still need enough
signal for therapy and Insights — without a gauntlet every night.

## Non-goals

- Adding sound as a sense
- Clinical sensory-integration assessment
- A new structured `look` field or look screen (look stays in why chips)
- A dedicated smell screen (smell stays in why chips)
- Native iOS Run (`run-tasting-session-ios`)
- Dropping `liked` or parent `ateEnough`
- Removing OpenAPI fields from the contract this PR (demoted fields stay nullable;
  new runs send `null`)
- Retuning Insights tip catalog beyond what still works with thinner texture/
  taste coverage on safe nights (no tip rewrite mega-pass)
- Redesigning History/PDF layout (still show fields when present; demoted ones
  usually “Skipped” / `-` on new nights)

## Approach

**Locked — shorten + dedupe, adaptive by familiarity, chip icons**

### Kid path (web Run)

Per food, step order:

1. **liked** (unchanged)
2. **why** chips + optional note (unchanged encoding into `whyNote`)
3. **If stretch** (`familiarity !== "safe"`): **texture**, then **tastes**
4. **ateEnough** (parent, required)

Safe foods skip texture and tastes. Stretch = familiar-but-new, truly_new, or
retrying (same “not safe” rule as reward games).

**Removed from kid path:** temperature, smell, change. Complete payload sends
`null` for those (and for texture/tastes on safe foods).

Sense language (including look and smell) lives in **why chips**, not extra
screens.

### Why chip icons (same PR)

Each why chip shows a **simple graphic + text label** so pre-readers can learn
to recognize chips by image, text, or both. Parent can still help; icons must
not replace accessible text (`aria-label` / visible label). Map every v1 chip
string in `WHY_CHIPS_BY_LIKED` to a dedicated icon (SVG or existing run icon
style — match brand, no emoji-only if the rest of Run uses FoodIcon-style
assets). Icon set is fixed with the chip copy for this PR.

### Parent notes (after reward)

Same screen, **two text areas**:

1. General session notes (existing `parentNote` prompt, tightened copy OK)
2. **What could we change next time?** (useful prompt, parent-facing)

**Persist:** One `PATCH` `parentNote` string. Encode both parts with clear
labels when saving, e.g.:

```text
Notes: …
Change next time: …
```

Omit a section if that textarea is blank. Both blank → Skip / null as today.
Do **not** write per-food `changeNote` from this screen (always `null` on
complete for new runs). No new OpenAPI fields this PR.

### Layers

Web Run (`RunSessionPage` step list by familiarity, `WhyNoteStep` icons,
`ParentNotesStep` dual fields) + tests. Mobile clients unchanged (no Run UI).
Backend/OpenAPI unchanged except docs/tests still accept nullable demoted
fields.

## Acceptance criteria

- [x] Safe food Run path is **liked → why → ateEnough** (no texture, tastes,
      temperature, smell, or change steps).
- [x] Stretch food Run path is **liked → why → texture → tastes → ateEnough**
      (no temperature, smell, or change steps).
- [x] Stretch = any planned familiarity other than `safe`.
- [x] Complete request sends `null` for temperature, smell, and changeNote; safe
      foods also send `null` for texture and tastes when those steps were skipped
      by design.
- [x] Each why chip shows an icon and its text label; every v1 chip has an icon;
      chips remain multi-select with the same encode/`whyNote` rules.
- [x] After reward, parent notes screen has two text areas (general + change next
      time); Save writes one labeled `parentNote` (or null if both empty); Skip
      unchanged.
- [x] History/PDF still render existing fields; no layout redesign required.
- [x] No new OpenAPI schemas/fields; no native Run UI; no smell/look screens.
- [x] Tests: RunSessionPage covers safe vs stretch step sequences, complete
      payload nulls, why chip icons present, ParentNotesStep dual-field save
      encoding.

## Tasks

- [x] Web: Adaptive `RUN_STEPS` (or equivalent) by food familiarity; remove
      temperature / smell / change from UI.
- [x] Web: Why chip icon map + `WhyNoteStep` UI (graphic + label).
- [x] Web: `ParentNotesStep` two textareas + labeled `parentNote` encode/decode
      for edit display if needed.
- [x] Tests: RunSessionPage safe/stretch paths + complete payload; WhyNoteStep /
      chip icons; ParentNotesStep encoding.
- [x] Docs: Roadmap rename (`run-sense-survey` → `run-survey-shorten`); archive
      planned stub.

## Decisions (locked)

- Direction D+E: shorten + dedupe; adaptive on non-safe.
- Stretch asks **texture and tastes** (texture kept — important for this child
  and likely others).
- Smell: **chips only** (no smell screen).
- No structured look field.
- Temperature demoted from kid path.
- Change prompt: parent-only, **separate textarea** on parent-notes screen,
  stored inside `parentNote` with labels.
- Why chip **icons in the same PR**.
- Roadmap id renamed to `run-survey-shorten`.

## Open questions

- _(none)_
