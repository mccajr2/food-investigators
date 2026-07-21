# Spec: brand-identity

Status: draft  
Created: 2026-07-21  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-21 · enhancement

## Problem

The web app still reads as a generic kitchen / “quickapp” template. We have an
official Food Investigators logo (navy, lime, coral, amber, sky, cream; bubbly
type; characters including a cartoon of the family’s kid) and want Auth, Plan,
History, Foods, the tasting run, and reward games (Catch / Cross) to feel like
one brand — without the full logo fighting kid prompts or play controls.

## Non-goals

- Native iOS / Android branding (`run-tasting-session-ios` and later)
- Custom per-food illustrations (`custom-food-icons`)
- Redesigning game mechanics, difficulty, or reward unlock rules
- Therapist PDF letterhead polish (optional follow-up)
- Full dark-mode redesign or multi-theme switcher
- New sound packs (Catch + Cross audio enhancements — separate roadmap item)
- Replacing stock run-option emoji with brand art
- Marketing / landing page outside the signed-in product

## Approach

Apply the logo palette and friendly type **globally** on web, and place the logo
artwork by surface so the kid still sees “himself” without crowding the ritual.

**Logo placement (locked):**

| Surface | Treatment |
|---------|-----------|
| Auth (sign-in / register) | Full logo as the hero brand mark (replace “quickapp”) |
| Plan / History / Foods shell header | Full logo (or scaled full mark) in chrome |
| Tasting questions + Catch / Cross **play** | Compact mark only (small logo or cropped characters) in the run header |
| Reward encourage / Which game? / Surprise reveal | Fuller logo once — celebration beat with room to breathe; skip if it crowds tiles |

**Tokens & type:**

- Copy the official logo into `web/public/` (e.g. `food-investigators-logo.jpg`)
  and wire `<img>` / CSS with meaningful `alt` (“Food Investigators”).
- Retune `:root` CSS variables to the logo palette (navy primary, cream surfaces,
  lime / coral / amber / sky as accents — not purple-on-white or terracotta-cream
  cliché). Document token → color mapping in a short comment block in
  `index.css`.
- Retune `[data-theme="kitchen-run"]` so run + Catch + Cross inherit the same
  brand family (replace sage-kitchen primary with brand navy / accents while
  keeping placemat tiles, Fredoka/Nunito, and existing light motion).
- Extend friendly fonts to the parent shell where headings/nav currently feel
  generic; keep body readable (Nunito or equivalent already loaded).
- Update document `<title>` (and favicon if a simple derived mark is easy;
  otherwise keep existing favicon and note as follow-up).

**Layers:** Web only. No OpenAPI / backend / mobile changes.

**Tests:** Update AuthShell / run assertions that still hard-code “quickapp” or
old theme expectations; add smoke that logo mark(s) render on Auth + signed-in
header and that run root still exposes the scoped theme hook.

## Acceptance criteria

- [ ] Official logo asset lives under `web/public/` and is used by the app (not
      only under Cursor session assets).
- [ ] Auth screens show the **full** Food Investigators logo; no “quickapp”
      product title remains in the UI or document `<title>`.
- [ ] Signed-in Plan / History / Foods shell shows the **full** logo in header
      chrome.
- [ ] Tasting run questions and Catch / Cross **play** show a **compact** brand
      mark in the run header (not the full banner competing with placemats /
      game board).
- [ ] Reward encourage and/or Which game? (and Surprise reveal if present) show a
      **fuller** logo once when layout allows; play screens stay compact.
- [ ] Global shell + kitchen-run tokens use the logo palette (navy / cream /
      multi-accent); Catch and Cross chrome inherit without game-logic changes.
- [ ] Parent shell and run use on-brand rounded fonts (Fredoka/Nunito or
      equivalent already in the project) — not Inter/Roboto/system-only chrome.
- [ ] No OpenAPI or backend changes.
- [ ] AuthShell / run / reward component tests stay green; assertions cover logo
      presence (Auth + shell) and compact mark on run; kitchen-run theme hook
      smoke still passes.

## Tasks

- [ ] Web: Add logo file to `web/public/`; shared logo / compact-mark component(s)
      with accessible `alt`.
- [ ] Web: Retune `:root` + `[data-theme="kitchen-run"]` tokens; apply brand fonts
      on shell headings/nav; update `index.html` title (favicon if trivial).
- [ ] Web: Wire full logo on Auth + signed-in header; compact mark on run play
      header; fuller logo on reward encourage / game-pick beat.
- [ ] Tests: Replace “quickapp” expectations; smoke for logo / compact mark /
      theme hook; keep AuthShell, run, reward, Catch, Cross tests green.

## Decisions (locked)

- **Platform:** Web only.
- **Logo spots:** Full on Auth + shell; compact on run/play; fuller once on
  reward pick / encourage.
- **Theming:** Global token retune + kitchen-run retune so games inherit; do not
  invent a second unrelated kid palette.
- **Contract:** No OpenAPI / backend.

## Open questions

_(none — ready for approval)_
