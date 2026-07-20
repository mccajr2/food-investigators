# Product roadmap

Status: active  
Updated: 2026-07-19

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
| 1 | therapist-printout | planned | 2026-07-11 · initial | Printable session history packet for doctor / food therapist |
| 2 | reward-mini-games | planned | 2026-07-11 · initial | Curated mini-game templates; unlock when parent marks ate enough; food-themed skins |
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

## Active specs

In-progress work (locked for re-rank — finish, amend, or abandon before reshuffle).

_(none)_

## Done

| Id | Completed | Spec |
|----|-----------|------|
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
