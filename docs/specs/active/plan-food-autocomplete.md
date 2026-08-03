# Spec: plan-food-autocomplete

Status: draft  
Created: 2026-08-03  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-08-03 · enhancement  
Specced: 2026-08-03  
Branch: `plan-food-autocomplete`

## Problem

Plan session food pickers use a long native `<select>`. With ~26 system starters
plus household tasting foods, the list is already hard to scan; signup intake
and customs make it worse. Parents need a typeahead text filter with a filtered
dropdown of matching foods so they can find a food by typing instead of scrolling
an unbounded list.

## Non-goals

- Changing Plan create/update API, food ids, or any OpenAPI contract surface
- Server-side search / pagination (client filter of the already-loaded
  `GET /api/foods` list is enough for beta catalog sizes)
- Creating / inventing new foods from the Plan picker (stay pick-existing;
  customs stay on Foods)
- Autocomplete on Foods create / edit forms
- Native iOS / Android Plan UI
- Changing familiarity autofill, variant-note `datalist`, snack exclusion rules,
  or Suggest API behavior — only the food **picker control** changes
- Replacing familiarity or date controls with typeahead

## Approach

**Web-only.** Replace the native food `<select>` inside `FoodSlotFields`
(`web/src/components/plan/PlanPage.tsx`) with an accessible combobox: text input
+ filtered listbox. `FoodSlotFields` is shared by create/edit and Suggest-draft
review, so both get the same control (intentional; not a separate Suggest
feature).

**Dependency (approved):** add a small accessible combobox stack rather than
hand-rolling. Prefer the usual shadcn-style pairing already aligned with this
repo’s Radix + Tailwind UI: `cmdk` for the command/listbox, plus
`@radix-ui/react-popover` if needed to anchor the dropdown. Add only what the
combobox needs; do not introduce a large UI kit. Ask before adding anything
beyond those two.

**Filter behavior:**

- Options remain **session-eligible** foods only (`sessionEligible !== false`),
  same as today.
- Filter is **case-insensitive substring** match on `food.name`.
- Empty query with the list open shows the full session-eligible list (still
  small for beta); typing narrows it. Show an empty state when nothing matches
  (e.g. “No foods match”).
- Selecting an option sets `slot.foodId` to that food’s id and keeps existing
  side effects (familiarity autofill from exposures, variant datalist for the
  selected food).
- Keyboard: type to filter, arrow keys to move, Enter to select, Escape to
  close — rely on `cmdk` / Popover defaults where possible.
- Preserve existing accessible naming (`aria-label` / labels that include the
  slot name, e.g. “Food 1 picker”).

**No backend / contract / mobile client changes.**

## Acceptance criteria

- [ ] Plan create/edit food slots no longer use a native food `<select>`; they
      use a typeahead combobox (input + filtered dropdown).
- [ ] Suggest-draft review slots use the same combobox (shared `FoodSlotFields`).
- [ ] Typing filters the open list by case-insensitive substring of food name;
      empty query shows all session-eligible foods.
- [ ] Snacks (`sessionEligible === false`) remain excluded from options.
- [ ] Choosing a match sets that food’s id on the slot; familiarity autofill and
      variant-note behavior still work as before.
- [ ] No match → empty state in the list; parent cannot submit a free-typed name
      as a new food (must pick an existing option).
- [ ] Combobox remains usable with keyboard (filter, move, select, dismiss).
- [ ] No OpenAPI / backend / mobile sharedLogic changes in this PR.
- [ ] Unit/component tests: filter narrows options; select applies food id;
      snacks still excluded. Existing PlanPage tests updated for the new control.
- [ ] New dependency is only the approved combobox stack (`cmdk` and, if needed,
      `@radix-ui/react-popover`); lockfile updated via the project’s npm/Corepack
      workflow.

## Tasks

- [ ] Web: add `cmdk` (+ `@radix-ui/react-popover` only if required); thin
      shadcn-style Combobox/Command primitives under `web/src/components/ui/` as
      needed.
- [ ] Web: replace food `<select>` in `FoodSlotFields` with the combobox wired to
      session-eligible foods + name filter.
- [ ] Web: update `PlanPage.test.tsx` (and any small unit test for the combobox
      helper) for filter / select / snack exclusion; keep existing Plan flows
      green.
- [ ] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Out of scope: no invent-from-Plan, no server search, no OpenAPI, web Plan first.
- Dependency: do not hand-roll; add small `cmdk` (+ Popover if needed).

Accepted risk:

- Suggest-draft slots pick up the same control via shared `FoodSlotFields` —
  desirable consistency, not extra scope.
- Empty-query open list still shows the full eligible catalog (~30); typeahead
  is for findability, not hard pagination.
