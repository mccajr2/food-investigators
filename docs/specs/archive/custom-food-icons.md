# Spec: custom-food-icons

Status: done  
Created: 2026-07-20  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-20 · enhancement

## Problem

Food identity and reward pick tiles still feel thin next to the official Food
Investigators logo: starter `FoodIcon` SVGs are simple geometry, and Catch /
Cross / Match / Surprise tiles use stock emoji (🧺🐸🃏✨). For this household the
ten foods he’s most likely to eat should look custom and on-brand — including a
few that aren’t in the starter library yet.

## Non-goals

- AI-generated or per-food novel art (`ai-game-variants`)
- Redrawing **every** existing `FOOD_ICON_KEYS` entry (non-hero leftovers keep
  today’s SVGs)
- Replacing custom-household emoji / initials fallbacks (`generatedFoodIcon`) —
  defer
- Photoreal photos, licensed stock packs, or new npm art deps
- Renaming or removing existing starter foods (only **add** missing heroes +
  redraw the listed set)
- Native iOS / Android-native icon assets (Kotlin/SwiftUI drawing) — web SVG +
  shared keys; mobile follows keys when it already renders `FoodIcon`-equivalent
- Replacing app chrome / logo placement (`brand-identity` / `kid-run-ui`)
- Game mechanics beyond Which-game tile art

## Approach

Logo-aligned inline SVG (navy / cream / lime / coral / amber / sky; bubbly
shapes). Keep the `iconKey` → `FoodIcon` pipeline.

**Hero list (this PR — his top 10)**

| # | Food (display) | `iconKey` | Notes |
|---|----------------|-----------|--------|
| 1 | Strawberries | `strawberry` | exists — redraw |
| 2 | Banana | `banana` | exists — redraw |
| 3 | Instant ramen | `ramen` | exists — redraw |
| 4 | Bagel and cream cheese | `bagel_cream_cheese` | exists — redraw |
| 5 | Plain yogurt | `yogurt_plain` | exists — redraw |
| 6 | Chocolate chip pancakes | `pancakes_choc_chip` | exists — redraw |
| 7 | Cheese pizza | `cheese_pizza` | **new** key + starter row |
| 8 | Soft pretzels | `soft_pretzel` | **new** key + starter row |
| 9 | Chicken tenders | `chicken_tenders` | exists — redraw |
| 10 | Raspberries | `raspberry` | **new** key + starter row |

**New keys / catalog**

- Add `cheese_pizza`, `soft_pretzel`, `raspberry` to web `FOOD_ICON_KEYS`,
  backend `FoodIconKeys` allowlist, and a Flyway seed for three system starter
  foods (stable UUIDs, same pattern as `V3__foods.sql`).
- OpenAPI `FoodIconKey` is already a patterned string (not a closed enum) — no
  schema change required unless docs examples need updating. Still update web +
  backend allowlists in the same PR (AGENTS: don’t invent keys on one side only).
- Mobile: if sharedLogic validates icon keys, add the three keys there too;
  otherwise no mobile UI work this PR.

**Run pick symbols**

Replace emoji on reward **Which game?** tiles with SVG marks for Catch, Cross,
Match, Surprise (e.g. `RunGameSymbol`). Sibling style to food icons.

**Style lock**

- Soft fills, rounded silhouettes; readable at ~40–56px
- Brand palette hexes / tokens; no purple / generic gray defaults
- Inline SVG only; decorative / existing a11y labeling

**Layers / tests**

- Backend: allowlist + migration + unit/integration assertions for new starters /
  valid keys.
- Web: hero SVGs + labels + run symbols; Foods picker includes new keys.
- Tests: icon smoke for all 10 heroes; Which game? non-emoji symbols; foods
  allowlist tests; run/reward suites green.

## Acceptance criteria

- [x] All 10 hero foods above have **logo-aligned SVG** art via `FoodIcon` /
      `iconKey` (new keys included).
- [x] `cheese_pizza`, `soft_pretzel`, and `raspberry` are valid starter keys
      (allowlist + system catalog rows) and selectable like other starters.
- [x] Non-hero existing keys still render (current art OK this PR).
- [x] Reward **Which game?** tiles use on-brand SVG symbols (not 🧺🐸🃏✨).
- [x] No AI art pipeline; no new binary illustration packs.
- [x] Backend foods tests + web Foods / RewardFlow / run tests stay green.

## Tasks

- [x] Backend + contract alignment: add three icon keys to allowlist; Flyway seed
      for Cheese pizza, Soft pretzels, Raspberries; tests.
- [x] Web: Redraw / add SVG for all 10 hero `FoodIcon`s + labels; extend
      `FOOD_ICON_KEYS`.
- [x] Web: Catch / Cross / Match / Surprise SVG symbols; wire RewardFlow tiles.
- [x] Tests: Hero smoke + new starters + Which game? symbols; keep foods / run /
      reward suites green.

## Decisions (locked)

- **Hero set:** His top-10 eat list (table above), not the previous generic 10.
- **New foods:** Pizza, soft pretzel, raspberry added as starters + keys.
- **Medium:** Hand-tuned inline SVG; logo palette / bubbly feel.
- **Not this PR:** AI art, custom-food emoji fallbacks, redrawing every leftover
  starter.
- **Platform:** Web SVG + backend catalog/allowlist; no native icon redesign.

## Open questions

_(none)_
