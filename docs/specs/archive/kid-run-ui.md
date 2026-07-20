# Spec: kid-run-ui

Status: done  

Created: 2026-07-20  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-20 · enhancement

## Problem

The iPad tasting run is already simple enough for a 5–6 year old, but the
visual surface still reads like a generic CSS/component kit (flat gray/white
shadcn chrome). Parents want that same calm, easy flow with a look that feels
like Food Investigators — warm and kid-facing — without adding clutter or
reading load.

## Non-goals

- Changing outcome questions, skip rules, or the complete API / OpenAPI
- Restyling Plan / History / Foods / AuthShell (laptop shell stays as-is)
- Changing global `:root` theme tokens for the whole app
- New food illustrations or replacing stock run-option emoji
  (`custom-food-icons`)
- Native iOS theming (`run-tasting-session-ios`)
- Adding steps, badges, stats, or denser copy to the ritual
- Dark mode / neon / purple gradient “AI default” looks
- The cream + terracotta + display-serif combo as the default direction

## Approach

Restyle the **full-screen web run overlay only** (outcome steps, speech notes,
reward encourage/pick, Catch chrome) with a **soft kitchen table** atmosphere:

- **Scoped theming:** Run-local CSS variables / classes on the run root (e.g.
  `RunSessionPage` dialog) so leaving the run does not require a global
  redesign. Do not change shared Plan/History pages in this PR.
- **Visual language:** Warm light background (soft gradient or subtle pattern —
  not flat single gray), placemat-style answer tiles (larger radius, clearer
  hit targets), friendly chunky typography for prompts (expressive webfont —
  not Inter/Roboto/system default alone). Accent color that feels fresh/foody
  without purple-on-white or terracotta-cream cliché.
- **Surfaces:** `IconChoiceStep`, `SpeechNoteStep`, run header, `RewardFlow`,
  and Catch shell/play frame share the same scoped tokens so the ritual feels
  one piece from start → reward.
- **Motion (light):** Soft enter on step/prompt change; gentle press feedback on
  answer tiles (2–3 intentional motions total). No looping ambient decoration.
- **Layers:** Web only. No backend / OpenAPI / mobile sharedLogic changes.
- **Tests:** Update/extend run component tests for structure/a11y that still
  applies; add a smoke assertion that the run root exposes the scoped theme
  hook (class or `data-theme`) so the restyle cannot silently regress.

## Acceptance criteria

- [x] Full-screen run ritual (questions → reward/Catch) uses a soft kitchen-table
      look distinct from the default gray/white shell behind it.
- [x] Plan / History / Foods / AuthShell visual appearance is unchanged when not
      in a run.
- [x] Outcome flow UX stays the same: same steps, prompts, skip rules, large
      targets; no new fields or API calls.
- [x] Answer tiles read as placemat-style choices (not default bordered cards
      only); prompts use expressive type sized for iPad.
- [x] At least two intentional motions: step/prompt enter + answer-tile press;
      no distracting loop animations.
- [x] Reward encourage / pick / Catch chrome shares the same scoped run theme.
- [x] No OpenAPI or backend changes.
- [x] Component tests for run steps / reward still pass; smoke check for scoped
      run theme hook.

## Tasks

- [x] Web: Scoped run theme tokens + kitchen-table restyle for
      `RunSessionPage` / `RunSteps` (choices + speech).
- [x] Web: Apply the same scoped theme to `RewardFlow` + Catch chrome (header /
      play frame / finish), without changing Catch game logic.
- [x] Web: Light motion (prompt enter + tile press).
- [x] Tests: Keep run/reward tests green; add smoke for scoped theme hook on
      run root.

## Decisions (locked)

- **Surfaces:** Run ritual overlay only (not whole signed-in app).
- **Direction:** Soft kitchen table (warm, placemat tiles, friendly type).
- **Theming:** Scoped to run root — no global token takeover.
- **Motion:** Light (enter + press); no ambient loops.
- **Icons/emoji art:** Out of scope (`custom-food-icons`).

## Open questions

_(none — ready for approval)_
