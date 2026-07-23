# Product roadmap

Status: active  
Updated: 2026-07-22

Living backlog for this product repo. **One roadmap ↔ many specs** (1:1 by
kebab-case id). `/roadmap` updates and re-ranks; `/spec <id>` fleshes out the
next slice. Do not turn this file into a mega-spec.

## Vision

**Food Investigators** helps a parent and a picky eater build a calm, repeatable
tasting ritual: plan two foods ahead on the laptop, run a parent-assisted session
on the iPad with large icons and simple words, capture what he liked and *why*
(in kid language), unlock simple food-themed mini-games when a serving goes well,
and keep a therapist-ready history of what was tried and what worked.

Familiarity ladder (parent-set at first): foods he already likes → familiar-but-new
(prep/brand) → truly new. Pace stays parent-led early; later the app may suggest
the next session for approval.

## Product non-goals

- Replacing a feeding therapist or clinical diagnosis
- Fully automatic meal planning or grocery ordering
- Dense reading-heavy UI for the child on iPad
- AI-invented games as the first reward system (templates + skins first)
- App-driven schedules that the parent must follow (suggestions come later;
  parent always decides)
- Multi-child / multi-household complexity in early slices
- Printable *upcoming* wall calendar as a v1 must-have (history print for doctor
  comes first)

## Upcoming (ranked)

Reorder only via `/roadmap` re-rank. Rank **1** is **Next up** for `/spec`.

| Rank | Id | Status | Added | Summary |
|------|-----|--------|-------|---------|
| 1 | session-plan-guards | active | 2026-07-22 · enhancement | Block past dates + one tasting session per calendar day |
| 2 | session-parent-notes | planned | 2026-07-22 · enhancement | Optional parent notes after reward (History + therapist PDF) |
| 3 | pace-insights | planned | 2026-07-11 · initial | Parent dashboard: trends on what’s working; gentle suggestions you can ignore |
| 4 | suggested-next-session | planned | 2026-07-11 · initial | App proposes next two foods + levels; parent approves or swaps |
| 5 | run-tasting-session-ios | planned | 2026-07-15 · re-rank split | Native SwiftUI same ritual (after web); needs paid Apple signing for durable install |
| 6 | ai-game-variants | planned | 2026-07-11 · initial | Optional AI skins/levels on top of template games for more variety |

Status values: `parking` · `planned` · `active` · `done` · `cancelled`  
Added: `YYYY-MM-DD · initial` | `enhancement` | `re-rank split`

## Parking lot

Unranked ideas. Promote into **Upcoming** with `/roadmap` (re-rank).

| Id | Added | Summary |
|----|-------|---------|
| printable-plan-calendar | 2026-07-11 · initial | Print upcoming tasting schedule (doctor packet is history-first) |
| offline-ipad-session | 2026-07-11 · initial | Run a session on iPad without network; sync later |
| multi-child-profiles | 2026-07-11 · initial | More than one kid under one household |
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
| session-plan-guards | `session-plan-guards` | [active](specs/active/session-plan-guards.md) |

## Done

| Id | Completed | Spec |
|----|-----------|------|
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
