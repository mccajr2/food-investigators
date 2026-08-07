# Product roadmap

Status: active  
Updated: 2026-08-05 · suggest-respect-exposure-familiarity shipped

Living backlog for this product repo. **One roadmap ↔ many specs** (1:1 by
kebab-case id). `/roadmap` updates and re-ranks; `/spec <id>` fleshes out the
next slice. Do not turn this file into a mega-spec.

## Vision

**Food Investigators** helps a parent and a picky eater build a calm, repeatable
tasting ritual: plan two foods ahead on the laptop, run a parent-assisted session
on the iPad with large icons and simple words, capture what he liked and *why*
through kid-friendly **senses** (taste, texture/touch, smell, look — not a clinical
panel), unlock simple food-themed mini-games when a stretch goes well (not for
routine safe foods), celebrate milestones, and keep a therapist-ready history of
what was tried and what worked.

Familiarity is a **household-persisted exposure profile** keyed by **food +
presentation** (brand/prep variant) — not food id alone and not only a Plan
slot: safe → familiar-but-new → truly new → retrying. Safe presentations usually
stay safe but are toggleable when tastes change. Catalog foods stay thin (one
Bagel); Bagelsaurus vs Trader Joe’s are separate exposures. Signup bootstraps
~5–10 truly safe exposures and may **invent** foods not yet in the DB (listed
snacks count as safe). The designed path uses that safe set to recommend
**adjacent** next foods/presentations — including ones not yet on the household
list — paced to progress; tries that don’t land become retrying. Parents may
also **nominate stretch targets** (specific foods for someday); the app
steers Suggest toward intermediate steps and proposes the destination only when
pace makes it a calm next try — still parent-led Suggest→Approve. A short
welcome explains why the product exists. Next: host a **soft (coached) beta**,
learn habit under stress, then a **more formal beta** before deeper Suggest /
native Run work.

## Product non-goals

- Replacing a feeding therapist or clinical diagnosis
- Fully automatic meal planning or grocery ordering
- Dense reading-heavy UI for the child on iPad
- AI-invented games as the first reward system (templates + skins first)
- App-driven schedules that the parent must follow (suggestions come later;
  parent always decides)
- Multi-child complexity before the household has a solid single-child baseline
  (`child-display-name` shipped; `multi-child-profiles` still parked)
- Printable *upcoming* wall calendar as a v1 must-have (history print for doctor
  comes first)
- Sound as a run-survey sense (taste / texture / smell / look only)
- Shipping new mini-game *engines* (or Nintendo-like clones) before soft beta —
  Catch / Cross / Match + Surprise are enough; variety nudges later if kids ask
- Guaranteeing AI-generated code is free of training-data / copyleft claims via
  a scanner — **no free tool reliably does that**; manage risk with review +
  dependency license policy (see Beta path)

## Beta path (soft → formal)

Operational gates (not every line is a `/spec` id). Ship ranked **Upcoming**
slices in order; run the human gates when the checklist says so.

### Environments (local → prod)

Keep a **clear two-lane path** through soft beta (no Kubernetes required):

| Lane | App | Data | Config |
|------|-----|------|--------|
| **Local** | `bootRun` + `npm run dev` | Docker Compose Postgres | `.env` / local profiles — never commit secrets |
| **Prod (soft beta)** | Render API + Render static/web | Neon Postgres | Render/Neon env vars + GitHub Actions secrets for deploy |

Formal beta adds `ci-cd-production` (auto-deploy on green `main`). Optional
**staging** stays parked until cold invites need a dress rehearsal
(`staging-environment`). Hosting specs must document: migrations, health
checks, CORS/API base URL, and “how to promote a fix.”

### Soft beta (coached) — goal: habit under stress

Invite **2–5 families** you can coach for **3–4 weeks**. Learning question:
do they keep Plan → Run ~2×/week?

**Ship before invite:**

1. `beta-backend-hosting` — Neon + Render API + keep-alive (**prod lane**) — **shipped**  
2. `beta-web-hosting` — Render web → prod API — **shipped**  
3. `soft-beta-ritual-polish` — safe+stretch coaching, one-tap Approve, Run Exit
   warn, Insights→Suggest CTA, hide demoted History fields, occupied-today —
   **shipped**  
4. `contracts-ci-paths` — include `contracts/**` in CI — **shipped**  
5. `secrets-scan-ci` — block accidental secrets (API keys, passwords) in PRs — **shipped**  

**Also before invite (ops, not a backlog id):** #52 stretch + #53 welcome are
merged; enable GitHub Dependabot alerts (free; no spec required); coaching
script + smoke test —
[docs/beta/soft-beta-friends-plan.md](beta/soft-beta-friends-plan.md),
[docs/beta/local-smoke-test.md](beta/local-smoke-test.md).

**Telemetry:** skip product analytics for soft beta — coached notes are enough.
Park `product-telemetry` until formal / uncoachable scale.

**During soft beta:** note Suggest trust, Run finish/Exit, Insights use, PDF
share — re-rank after, not from architect preference.

**Do not block soft beta on:** new game engines, stretch pathway depth,
AuthShell mega-split, OpenAPI codegen, native iOS Run, license/vuln CI suites,
outing recommendations.

### Supply chain & compliance (honest limits)

| Risk | Free / practical approach | Roadmap id |
|------|---------------------------|------------|
| **Secrets in git** | gitleaks (or TruffleHog) in CI + GitHub secret scanning if public | `secrets-scan-ci` |
| **Vulnerable deps** | Dependabot + `npm audit` / Trivy or OWASP dependency-check in CI | `dependency-vuln-ci` |
| **Reciprocal / copyleft in libraries** | Allowlist scan (e.g. npm `license-checker` + Gradle license report); fail on GPL/AGPL unless approved | `dependency-license-ci` |
| **AI code “copied from the internet”** | **No free scanner proves this.** Mitigate: don’t paste proprietary code into prompts; review sensitive PRs; dependency license policy above covers *libraries*, not model regurgitation | (process, not a feature) |

### Formal beta — goal: colder invite / team-ready

After soft-beta learnings (and any hotfix polish from feedback):

6. `milestone-badges` — visible progress after Insights unlock  
7. `reward-surprise-nudge` — cheap variety (Surprise-first / don’t-repeat-last)  
8. `dependency-vuln-ci` — automated vulnerability callouts in CI  
9. `dependency-license-ci` — fail build on disallowed dependency licenses  
10. `ci-cd-production` — auto-deploy on green `main`  
11. `authshell-split` — ApiProvider / AuthGate / AppShell  
12. `run-outcome-contract` — harden encodings before native Run / more clients  

Then product depth from evidence: stretch pathway / prep rotation → native Run
→ AI game variants. Later: `product-telemetry`, outing spots (parking).

## Upcoming (ranked)

Reorder only via `/roadmap` re-rank. Rank **1** is **Next up** for `/spec`.

| Rank | Id | Status | Added | Summary |
|------|-----|--------|-------|---------|
| 1 | milestone-badges | planned | 2026-07-28 · enhancement | Celebration badges (formal-beta progress signal) |
| 2 | reward-surprise-nudge | planned | 2026-08-04 · enhancement | Cheap game variety: Surprise-first / avoid repeating last pick |
| 3 | dependency-vuln-ci | planned | 2026-08-05 · enhancement | Dependabot + CI vuln scan (npm/Gradle/Trivy) for known CVEs |
| 4 | dependency-license-ci | planned | 2026-08-05 · enhancement | Fail CI on disallowed dependency licenses (copyleft allowlist) |
| 5 | ci-cd-production | planned | 2026-07-29 · enhancement | After tests on `main`, auto-deploy backend + web to Render |
| 6 | authshell-split | planned | 2026-08-04 · enhancement | Split AuthShell into ApiProvider + AuthGate + AppShell |
| 7 | run-outcome-contract | planned | 2026-07-30 · enhancement | Harden run/outcome contract before native Run / more clients |
| 8 | disliked-prep-rotation | planned | 2026-07-28 · enhancement | Suggest distinct preps of a disliked food (~3 over weeks), then longer rest |
| 9 | run-tasting-session-ios | planned | 2026-07-15 · re-rank split | Native SwiftUI same ritual (after web habit sticks); needs paid Apple signing |
| 10 | ai-game-variants | planned | 2026-07-11 · initial | Optional AI skins/levels on template games (after formal beta; not soft-beta gate) |

Status values: `parking` · `planned` · `active` · `done` · `cancelled`  
Added: `YYYY-MM-DD · initial` | `enhancement` | `re-rank split`


## Parking lot

Unranked ideas. Promote into **Upcoming** with `/roadmap` (re-rank).

| Id | Added | Summary |
|----|-------|---------|
| run-exit-soft-save | 2026-08-05 · enhancement | Persist partial Run outcomes on Exit (API); after warn-only in `soft-beta-ritual-polish` if nights still get lost |
| product-telemetry | 2026-08-05 · enhancement | Privacy-light usage signals (e.g. Suggest/Run/Insights funnels); skip soft beta — coached notes first |
| outing-spot-recommendations | 2026-08-05 · enhancement | Plan a trip/outing: find/recommend spots friendly to picky eaters (maps/places; after core ritual sticks) |
| staging-environment | 2026-08-05 · enhancement | Optional staging Render/Neon dress rehearsal before cold formal invites |
| stretch-pathway | 2026-08-03 · re-rank split | Stronger intermediate ladder + path progress (after soft/formal beta evidence; C-lite stretch shipped) |
| pacing-citation-library | 2026-08-03 · enhancement | Richer tagged pacing citation library beyond the small Suggest pack; parked while shipping curated static pack |
| on-demand-food-illustrations | 2026-07-30 · re-rank split | Online AI for custom food stickers; **parked 2026-07-31** (Gemini image quota / beta cost) — resume later; do not merge WIP branch |
| log-past-session | 2026-07-29 · enhancement | Explicit “log a past night” for vacation / away-from-iPad backfill (after `early-run-date-snap`) |
| product-tour | 2026-07-29 · enhancement | Richer multi-step tour if welcome-orientation isn’t enough for beta parents |
| multi-child-profiles | 2026-07-11 · initial | More than one kid under one household (after `child-display-name`) |
| taste-profile-matches | 2026-07-23 · enhancement | Larger “foods that taste like this” icon set (beyond run-button examples); parked 2026-07-25 |
| snack-taste-ai | 2026-07-24 · enhancement | Infer snack tastes via AI for Insights (no manual snack taste entry) |
| printable-plan-calendar | 2026-07-11 · initial | Print upcoming tasting schedule (doctor packet is history-first) |
| offline-ipad-session | 2026-07-11 · initial | Run a session on iPad without network; sync later |
| app-driven-schedule | 2026-07-11 · initial | App owns the calendar; parent mostly follows (after suggestions prove useful) |
| free-play-games | 2026-07-11 · initial | Play mini-games outside a tasting reward |
| reward-combo-streaks | 2026-07-21 · enhancement | Short combo / streak feedback in Catch or Cross for momentum |
| reward-difficulty-ramp | 2026-07-21 · enhancement | Gentle mid-round speed/pattern ramp without harsh fail loops |
| reward-mute-control | 2026-07-21 · enhancement | Parent mute / volume for reward game audio |
| reward-scores-sync | 2026-07-21 · enhancement | Household-synced high scores via API (after local scores prove useful) |
| reward-celebrate-fx | 2026-07-21 · enhancement | Light confetti / motion-lines on cheer moments (brand motion style) |

## Active specs

In-progress work (locked for re-rank — finish, amend, or abandon before reshuffle).

| Id | Branch | Spec |
|----|--------|------|
| — | — | *(none)* |

## Done

| Id | Completed | Spec |
|----|-----------|------|
| secrets-scan-ci | 2026-08-07 | [archive](specs/archive/secrets-scan-ci.md) |
| contracts-ci-paths | 2026-08-06 | [archive](specs/archive/contracts-ci-paths.md) |
| soft-beta-ritual-polish | 2026-08-06 | [archive](specs/archive/soft-beta-ritual-polish.md) |
| suggest-respect-exposure-familiarity | 2026-08-05 | [archive](specs/archive/suggest-respect-exposure-familiarity.md) |
| beta-web-hosting | 2026-08-05 | [archive](specs/archive/beta-web-hosting.md) |
| beta-backend-hosting | 2026-08-05 | [archive](specs/archive/beta-backend-hosting.md) |
| welcome-orientation | 2026-08-05 | [archive](specs/archive/welcome-orientation.md) |
| stretch-food-targets | 2026-08-04 | [archive](specs/archive/stretch-food-targets.md) |
| suggestion-pacing-evidence | 2026-08-03 | [archive](specs/archive/suggestion-pacing-evidence.md) |
| suggestion-adjacent-foods | 2026-08-03 | [archive](specs/archive/suggestion-adjacent-foods.md) |
| plan-food-autocomplete | 2026-08-03 | [archive](specs/archive/plan-food-autocomplete.md) |
| familiarity-from-outcomes | 2026-08-03 | [archive](specs/archive/familiarity-from-outcomes.md) |
| signup-safe-foods | 2026-08-03 | [archive](specs/archive/signup-safe-foods.md) |
| household-exposure-profiles | 2026-08-03 | [archive](specs/archive/household-exposure-profiles.md) |
| child-display-name | 2026-07-31 | [archive](specs/archive/child-display-name.md) |
| food-illustration-object-store | 2026-07-31 | [archive](specs/archive/food-illustration-object-store.md) |
| non-hero-food-illustrations | 2026-07-31 | [archive](specs/archive/non-hero-food-illustrations.md) |
| why-chip-sticker-art | 2026-07-31 | [archive](specs/archive/why-chip-sticker-art.md) |
| hero-food-illustrations | 2026-07-31 | [archive](specs/archive/hero-food-illustrations.md) |
| so-so-why-detail | 2026-07-30 | [archive](specs/archive/so-so-why-detail.md) |
| run-ux-polish | 2026-07-30 | [archive](specs/archive/run-ux-polish.md) |
| why-chip-illustrations | 2026-07-30 | [archive](specs/archive/why-chip-illustrations.md) |
| run-survey-shorten | 2026-07-30 | [archive](specs/archive/run-survey-shorten.md) |
| why-insights-surface | 2026-07-30 | [archive](specs/archive/why-insights-surface.md) |
| why-outcome-depth | 2026-07-30 | [archive](specs/archive/why-outcome-depth.md) |
| reward-skip-safe | 2026-07-30 | [archive](specs/archive/reward-skip-safe.md) |
| early-run-date-snap | 2026-07-29 | [archive](specs/archive/early-run-date-snap.md) |
| plan-occupied-dates | 2026-07-29 | [archive](specs/archive/plan-occupied-dates.md) |
| suggested-next-session | 2026-07-28 | [archive](specs/archive/suggested-next-session.md) |
| insights-taste-basics | 2026-07-24 | [archive](specs/archive/insights-taste-basics.md) |
| run-taste-basics | 2026-07-24 | [archive](specs/archive/run-taste-basics.md) |
| familiarity-retry | 2026-07-23 | [archive](specs/archive/familiarity-retry.md) |
| pace-insights | 2026-07-23 | [archive](specs/archive/pace-insights.md) |
| snack-taste-log | 2026-07-23 | [archive](specs/archive/snack-taste-log.md) |
| session-parent-notes | 2026-07-22 | [archive](specs/archive/session-parent-notes.md) |
| session-plan-guards | 2026-07-22 | [archive](specs/archive/session-plan-guards.md) |
| custom-food-icons | 2026-07-22 | [archive](specs/archive/custom-food-icons.md) |
| reward-match | 2026-07-21 | [archive](specs/archive/reward-match.md) |
| reward-high-scores | 2026-07-21 | [archive](specs/archive/reward-high-scores.md) |
| reward-game-visuals | 2026-07-21 | [archive](specs/archive/reward-game-visuals.md) |
| reward-game-audio | 2026-07-21 | [archive](specs/archive/reward-game-audio.md) |
| brand-identity | 2026-07-21 | [archive](specs/archive/brand-identity.md) |
| reward-cross | 2026-07-21 | [archive](specs/archive/reward-cross.md) |
| kid-run-ui | 2026-07-20 | [archive](specs/archive/kid-run-ui.md) |
| reward-mini-games | 2026-07-19 | [archive](specs/archive/reward-mini-games.md) |
| therapist-printout | 2026-07-19 | [archive](specs/archive/therapist-printout.md) |
| session-history | 2026-07-19 | [archive](specs/archive/session-history.md) |
| run-tasting-session | 2026-07-19 | [archive](specs/archive/run-tasting-session.md) |
| plan-tasting-session | 2026-07-15 | [archive](specs/archive/plan-tasting-session.md) |
| food-catalog | 2026-07-14 | [archive](specs/archive/food-catalog.md) |
| family-account | 2026-07-13 | [archive](specs/archive/family-account.md) |
| template-packaging | 2026-07-11 | [archive](specs/archive/template-packaging.md) |
| path-filtered-ci | 2026-07-10 | [archive](specs/archive/path-filtered-ci.md) |
| web-scaffold | 2026-07-10 | [archive](specs/archive/web-scaffold.md) |
| kmp-networking-spike | 2026-07-10 | [archive](specs/archive/kmp-networking-spike.md) |

## Roadmap history

Only notable events (first carve-up, major re-rank, cancelled theme) — not every edit.

| Date | Event |
|------|--------|
| 2026-07-10 | Roadmap file introduced (empty product backlog; infra specs recorded under Done). |
| 2026-07-11 | Template packaging: Vision/non-goals clarify upstream is a starter template. |
| 2026-07-11 | First product carve-up for Food Investigators (picky-eater tasting ritual). |
| 2026-07-13 | family-account shipped (Postgres auth + web/iOS sign-in; greeting harness removed). |
| 2026-07-14 | food-catalog shipped (starter library + household foods; web manage UI). |
| 2026-07-15 | plan-tasting-session shipped (web plan create/list/edit/cancel; sessions API). |
| 2026-07-15 | run-tasting-session split: web iPad-optimized first; native iOS deferred (`run-tasting-session-ios`). |
| 2026-07-19 | run-tasting-session shipped (web runner + complete API). Re-rank: `session-history` Next up; native iOS dropped below rewards/insights until device install is worth it. |
| 2026-07-19 | session-history shipped (web History tab + `GET /api/sessions/history`). Next up: `therapist-printout`. |
| 2026-07-19 | therapist-printout shipped (History PDF download + date filter). Next up: `reward-mini-games`. |
| 2026-07-19 | reward-mini-games shipped (post-complete Catch reward on web runner). Next up: `pace-insights`. |
| 2026-07-20 | Re-rank: kid engagement ahead of insights — `kid-run-ui` → `custom-food-icons` → `reward-cross-match`, then `pace-insights`. |
| 2026-07-20 | kid-run-ui shipped (scoped kitchen-table run theme + light motion). Next up: `custom-food-icons`. |
| 2026-07-20 | Split `reward-cross-match` → `reward-cross` + `reward-match`; deprioritize `custom-food-icons`. Next up: `reward-cross`. |
| 2026-07-21 | Added `brand-identity` (logo + palette/fonts on all web screens & games); ranked after active `reward-cross`, ahead of Match / custom icons. |
| 2026-07-21 | reward-cross shipped (Cross + Catch/Cross/Surprise pick). Next up: `brand-identity`. |
| 2026-07-21 | brand-identity shipped (logo + palette/fonts + button contrast). Next up: `reward-match`. |
| 2026-07-21 | Split Catch/Cross polish into `reward-game-audio` → `reward-game-visuals` → `reward-high-scores` (ahead of Match). Next up: `reward-game-audio`. |
| 2026-07-21 | reward-game-audio shipped (Catch/Cross beds, ouch, catch blip, cheers). Next up: `reward-game-visuals`. |
| 2026-07-21 | reward-game-visuals shipped (Catch basket, Cross multi-kind + statics/pattern gate, shared HUD type). Next up: `reward-high-scores`. |
| 2026-07-21 | reward-high-scores shipped (local Best + New best! cheer on Catch/Cross finish). Next up: `reward-match`. |
| 2026-07-21 | reward-match shipped (memory pairs + Surprise includes Match). Next up: `custom-food-icons`. |
| 2026-07-22 | custom-food-icons shipped (hero SVG foods + run game symbols; pizza/pretzel/raspberry starters). Next up: `pace-insights`. |
| 2026-07-22 | UX cleanup ahead of insights: `session-plan-guards` → `session-parent-notes`, then `pace-insights`. |
| 2026-07-22 | session-plan-guards shipped (past dates blocked, one session/day, same-food needs distinct variants). Next up: `session-parent-notes`. |
| 2026-07-22 | session-parent-notes shipped (optional notes after reward; History + therapist PDF). Next up: `pace-insights`. |
| 2026-07-23 | Demoted draft `pace-insights` to planned; added `snack-taste-log` as Next up so Insights v1 can use snack texture/taste signal. |
| 2026-07-23 | Parking: `signup-starter-snacks` (optional signup picks for child tasting foods + snacks; after snack-taste-log). |
| 2026-07-23 | snack-taste-log shipped (snack foods + liked/texture/taste note; excluded from Plan). Next up: `pace-insights`. |
| 2026-07-23 | pace-insights shipped (aggregates + dismissible tips; snacks merged into liked/texture). Next up: `suggested-next-session`. |
| 2026-07-23 | Added taste-basics + familiarity-retry slices; re-rank: `familiarity-retry` Next up, then taste capture → insights → icon matches; `suggested-next-session` deferred. |
| 2026-07-23 | familiarity-retry shipped (Safe/Retrying ladder; `likes`→`safe`). Next up: `run-taste-basics`. |
| 2026-07-24 | run-taste-basics shipped (sweet/salty/bitter/sour on run; History/PDF; broccoli/dark chocolate/spinach starters). Next up: `insights-taste-basics`. |
| 2026-07-24 | insights-taste-basics shipped (`topLikedTastes` + `lean_into_taste`; session-only). Next up: `taste-profile-matches`. |
| 2026-07-25 | Parked `taste-profile-matches` (taste-button examples enough for now). Next up: `suggested-next-session`. |
| 2026-07-25 | Specced `suggested-next-session` (AI propose→approve; heuristic fallback). Split: `suggestion-pacing-evidence` ranked next. |
| 2026-07-28 | suggested-next-session shipped (Plan Suggest→Approve; Gemini Flash + heuristic; OpenAPI/web/mobile clients). Next up: `suggestion-pacing-evidence`. |
| 2026-07-28 | Carved ritual polish batch: occupied Plan dates, skip-safe rewards, why depth, sense survey, child name, prep rotation, badges; promoted `signup-starter-snacks`. Next up: `plan-occupied-dates`. |
| 2026-07-28 | Specced `plan-occupied-dates` (web calendar picker via `react-day-picker`; disable past + occupied). Next up: `reward-skip-safe`. |
| 2026-07-29 | plan-occupied-dates shipped (Plan/Suggest month calendar; past + occupied greyed). Next up: `reward-skip-safe`. |
| 2026-07-29 | Re-rank for beta friend: ritual polish (incl. `early-run-date-snap`) → `welcome-orientation` → Render/Neon hosting + CI/CD; park `log-past-session` / `product-tour`. Next up: `early-run-date-snap`. |
| 2026-07-29 | Specced `early-run-date-snap` (confirm at Run start; update to today via existing API). Next up after ship: `reward-skip-safe`. |
| 2026-07-29 | early-run-date-snap shipped (Plan Run confirm + snap to today; calendar zone for past-date checks). Next up: `reward-skip-safe`. |
| 2026-07-29 | Specced `reward-skip-safe` (games only for non-safe ate-enough; encourage when none). Next up after ship: `why-outcome-depth`. |
| 2026-07-30 | reward-skip-safe shipped (stretch-only game unlock; habit vs try-again encourage copy). Next up: `why-outcome-depth`. |
| 2026-07-30 | Specced `why-outcome-depth` (Run chips + optional note → `whyNote`). Split Insights to `why-insights-surface` (rank 2). |
| 2026-07-30 | why-outcome-depth shipped (liked-specific why chips + optional note → `whyNote`). Next up: `why-insights-surface`. |
| 2026-07-30 | Specced `why-insights-surface` (recent why snippets + chip-count tips on Insights; OpenAPI). Next up after ship: `run-sense-survey`. |
| 2026-07-30 | why-insights-surface shipped (Insights recent whys + chip-count tips). Next up: `run-sense-survey`. |
| 2026-07-30 | Renamed `run-sense-survey` → `run-survey-shorten`; specced shorten + adaptive stretch + why-chip icons (not sense-screen tour). |
| 2026-07-30 | Added `run-outcome-contract` (rank before `run-tasting-session-ios`): harden informal run/outcome encodings before native Run. |
| 2026-07-30 | Added `ritual-illustrations` (rank 2): kid-clear cartoon art for why chips + foods; AI-assisted assets after `run-survey-shorten`. |
| 2026-07-30 | run-survey-shorten shipped (adaptive Run path; why-chip icons; dual parent notes). Next up: `ritual-illustrations`. |
| 2026-07-30 | Split `ritual-illustrations` → active `why-chip-illustrations` (offline AI-assisted chip art) + planned `food-illustrations-ai` (heroes + online on-demand food art). |
| 2026-07-30 | why-chip-illustrations shipped (kid-clear why-chip cartoons + labels). Next up: `food-illustrations-ai`. |
| 2026-07-30 | Added `run-ux-polish` (Next up) + `so-so-why-detail`: ship hanging Run Back/Continue UX; then richer so-so why chips. |
| 2026-07-30 | run-ux-polish shipped (survey + reward-pick Back; taste Continue). Next up: `so-so-why-detail`. |
| 2026-07-30 | Specced `so-so-why-detail`: so-so why = curated good∪bad chips (reuse Like/No strings); no middling fillers. |
| 2026-07-30 | so-so-why-detail shipped (mixed good/bad so-so chips; middling fillers removed). Next up: `food-illustrations-ai`. |
| 2026-07-30 | Split `food-illustrations-ai` → `hero-food-illustrations` (Next up, offline heroes) + planned `on-demand-food-illustrations` (online AI). |
| 2026-07-30 | Specced `hero-food-illustrations`: top-10 heroes as human-polished static SVGs (iOS-portable); on-demand AI stays planned. |
| 2026-07-31 | Added `why-chip-sticker-art` (rank 2 / next after heroes): redo why chips with the same PNG sticker pipeline as hero foods. |
| 2026-07-31 | hero-food-illustrations shipped (10 PNG hero stickers + FoodIcon wiring). Next up: `why-chip-sticker-art`. |
| 2026-07-31 | why-chip-sticker-art shipped (14 PNG why-chip stickers matching heroes). Next up: `on-demand-food-illustrations`. |
| 2026-07-31 | Split oversized `on-demand-food-illustrations` → `non-hero-food-illustrations` (Next up, offline 16 starters) → `food-illustration-object-store` (shared reuse) → `on-demand-food-illustrations` (customs AI). |
| 2026-07-31 | non-hero-food-illustrations shipped (16 PNG starters; all 26 catalog foods are stickers). Next up: `food-illustration-object-store`. |
| 2026-07-31 | food-illustration-object-store shipped (shared `food_illustrations` + optional `iconUrl`; R2/S3 adapter). Next up: `on-demand-food-illustrations`. |
| 2026-07-31 | Parked `on-demand-food-illustrations` (Gemini image quota / beta cost; WIP branch not merged). Next up: `child-display-name`. |
| 2026-07-31 | child-display-name shipped (optional household child first name; Settings + Plan/Run copy; OpenAPI/web/mobile). Next up: `signup-starter-snacks`. |
| 2026-08-03 | Added `plan-food-autocomplete` (rank 2): Plan typeahead food pickers as catalogs grow; stays after signup intake. |
| 2026-08-03 | Familiarity path carve-up: cancelled `signup-starter-snacks`; added `household-food-familiarity` → `signup-safe-foods` → `familiarity-from-outcomes` → `suggestion-adjacent-foods` (suggest beyond household list). Next up: `household-food-familiarity`. |
| 2026-08-03 | Reframed familiarity unit as food+variant **exposure profiles**: cancelled food-only `household-food-familiarity`; Next up `household-exposure-profiles`. Signup may invent foods not in DB. |
| 2026-08-03 | household-exposure-profiles shipped (persist food+variant familiarity; Foods safes; Plan autofill). Next up: `signup-safe-foods`. |
| 2026-08-03 | signup-safe-foods shipped (Create account safe-foods nudge; bootstrap-safes; invent OK). Next up: `plan-food-autocomplete`. |
| 2026-08-03 | Added `stretch-food-targets`; re-ranked after signup ship: `familiarity-from-outcomes` Next up, then autocomplete → adjacent → pacing → stretch. |
| 2026-08-03 | familiarity-from-outcomes shipped (complete → exposure upserts; never auto-downgrade safe; OpenAPI 0.13.0 hooks). Next up: `plan-food-autocomplete`. |
| 2026-08-03 | plan-food-autocomplete shipped (Plan food typeahead combobox via cmdk + Popover). Next up: `suggestion-adjacent-foods`. |
| 2026-08-03 | suggestion-adjacent-foods shipped (AI invent adjacent foods on Suggest; Approve match-or-create; OpenAPI 0.14.0). Next up: `suggestion-pacing-evidence`. |
| 2026-08-03 | Specced `suggestion-pacing-evidence` (curated pacing pack + Suggest pacingNote/citations). Parked richer library as `pacing-citation-library`. |
| 2026-08-03 | suggestion-pacing-evidence shipped (curated pack by paceHint; OpenAPI 0.15.0 pacingNote/citations; Plan Suggest UI). Next up: `stretch-food-targets`. |
| 2026-08-03 | Re-rank: welcome → hosting stack before `milestone-badges` (beta path ahead of celebration). Next up unchanged: `stretch-food-targets`. |
| 2026-08-03 | Specced `stretch-food-targets` (C-lite: Foods nominate + path-biased Suggest). Split fuller ladder to `stretch-pathway` (rank 2). |
| 2026-08-04 | stretch-food-targets shipped (Foods stretch-target CRUD; C-lite path-biased Suggest; OpenAPI 0.16.0). Next up: `stretch-pathway`. |
| 2026-08-04 | Re-rank: promote `welcome-orientation` to active (beta lay-of-land). Specced (household server dismiss + AuthShell panel). |
| 2026-08-05 | welcome-orientation shipped (AuthShell welcome panel; household dismiss; OpenAPI 0.17.0 / Flyway V17 after stretch took 0.16/V16). |
| 2026-08-05 | Soft→formal beta path: hosting → ritual polish → contracts CI → secrets scan; formal = badges → surprise → vuln/license CI → CI/CD → AuthShell → outcome contract. Park stretch-pathway + telemetry + outing spots. Next up: `beta-backend-hosting`. |
| 2026-08-05 | beta-backend-hosting shipped (Actuator health, Docker/Render, Neon env docs, CORS allowlist). Operator checklist in docs/beta/backend-hosting.md. Next up: `beta-web-hosting`. |
| 2026-08-05 | beta-web-hosting shipped (fail-closed VITE_API_BASE_URL, Static Site in render.yaml, docs/beta/web-hosting.md). Operator checklist for live site + CORS. Next up: `soft-beta-ritual-polish`. |
| 2026-08-05 | Hotfix ahead of polish: `suggest-respect-exposure-familiarity` (Suggest must honor household exposure familiarity, esp. safe). |
| 2026-08-05 | suggest-respect-exposure-familiarity shipped (Suggest familiarity from exposures; OpenAPI 0.18.0 `variantNote`). Next up: `soft-beta-ritual-polish`. |
| 2026-08-06 | Specced `soft-beta-ritual-polish` (web UX gate; Exit **warn-only**). Parked soft-save as `run-exit-soft-save`. |
| 2026-08-06 | soft-beta-ritual-polish shipped (Plan coaching + one-tap Approve, Run Exit warn, Insights→Suggest, History/PDF hide demoted fields, occupied-today calendar). Next up: `contracts-ci-paths`. |
| 2026-08-06 | contracts-ci-paths shipped (`contracts/**` on backend CI path filters + regression test). Next up: `secrets-scan-ci`. |
| 2026-08-07 | secrets-scan-ci shipped (gitleaks CI workflow, no path filters; architecture + structural test). Next up: `milestone-badges`. |
