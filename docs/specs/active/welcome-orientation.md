# Spec: welcome-orientation

Status: in-progress  
Created: 2026-07-29  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-29 · enhancement  
Specced: 2026-08-04  
Branch: `welcome-orientation`

## Problem

New beta parents can use Plan / Run / Insights without understanding *why* the
product exists. For many families, a selective eater turns travel and eating out
from easy to stressful — and outside help can be hard to get or keep (waitlists,
provider turnover). Food Investigators is a calm, parent-led way to try **small
tweaks** toward new foods by latching onto a child’s science curiosity and love
of simple tablet games — without turning the ritual into another screen-time
fight — and, at worst, to give the child **better words** for why a food doesn’t
work so parents (and therapists) can listen. The welcome should say that once,
then show the lay of the land. Dismissal must stick **server-side per household**
so a new browser or device does not replay the same intro.

## Non-goals

- Claiming to replace occupational therapy, food therapy, or clinical care
- Full interactive multi-step product tour / spotlights (`product-tour` parked)
- Video, long essay, or marketing landing page
- Blocking access until the welcome is finished (always dismissible)
- Per-parent / per-device dismiss (household-scoped only in this slice)
- Native iOS / Android welcome UI (DTO sync only if `UserResponse` / auth
  contract changes)
- Changing signup safe-foods nudge, Plan Suggest, Run ritual, Insights tips
  catalog, or stretch-target flows
- Auto-owned calendar (`app-driven-schedule`)

## Approach

### Locked product

1. **One short welcome panel** (dialog / overlay), not a multi-step tour. Parent
   can dismiss with a clear primary action (e.g. “Got it”). App remains usable
   underneath / after dismiss — never a hard gate.
2. **When:** After the parent is authenticated (sign-in, register, or session
   restore via `/api/auth/me`). Show while the household has not dismissed.
   Existing beta households that never saw it still get it once.
3. **Where (web):** Hosted from `AuthShell` (signed-in chrome) so it appears
   regardless of Plan / Foods / Insights / History tab. Do not bury it only on
   Plan.
4. **Copy tone & content (short paragraphs / bullets — warm, concrete, not a
   memoir or clinical pitch):**
   - **Why it exists:** Selective eating can make ordinary outings (travel,
     restaurants) feel heavy. Families often wait a long time for specialist
     help. This app is a gentle home practice in the meantime — **not** a
     replacement for therapy or a diagnosis tool.
   - **How it helps:** Use the child’s curiosity (science / “investigating”) and
     simple reward games they already like — paced so tablets stay a *support*,
     not a new problem. Aim for small, calm next tries; even when a food doesn’t
     land, capture kid-friendly **why** language (taste, texture, smell, look)
     so parents understand more.
   - **What it is not:** Not a meal planner, grocery app, or “fix the eater”
     program. Parent stays in charge.
   - **Lay of the land:** **Plan** (two foods ahead on the laptop) → **Run**
     (short tasting ritual, large icons — often on iPad) → **History /
     Insights** (what you tried and what the senses said).
   - **Pace:** Familiarity ladder + Suggest are **guidance**, not orders —
     parent always Approves what goes on the calendar.
   - **Voice:** Second-person to the parent (“you” / “your family”); hopeful but
     honest; no founder autobiography, no clinic names, no wait-list numbers in
     the UI.
5. **Dismiss once for the household.** After dismiss, never auto-show again
   (no “remind me later” in v1). No Settings “replay welcome” in this slice
   (accepted risk; can add later if needed).

### Locked API / backend

- Persist on the **household** in the **accounts** module (e.g. nullable
  `welcome_orientation_dismissed_at` on `households`), not Insights tip
  dismissals and not localStorage.
- Surface readiness on existing auth user payloads:
  - Extend `UserResponse` with `welcomeOrientationDismissed: boolean`
    (`true` once dismissed; `false` for new / never-dismissed households).
  - Include on register, login, and `GET /api/auth/me` (same schema).
- New authenticated endpoint, e.g. `POST /api/auth/welcome-orientation/dismiss`
  — idempotent **200** (repeat dismiss is fine). Sets the household timestamp.
- OpenAPI version bump from **0.15.0**; sync web + mobile sharedLogic DTOs /
  clients.
- No sessions/foods module changes.

### Web

- After signed-in user load: if `!welcomeOrientationDismissed`, show welcome
  panel; on dismiss call API, update local user state, hide panel.
- Loading / error on dismiss: keep panel open; show a short error; allow retry.
- Component + AuthShell tests (show when false; hide + call dismiss when true /
  after success).

## Acceptance criteria

- [ ] Authenticated parent whose household has not dismissed sees the welcome
      panel after sign-in / register / session restore.
- [ ] Welcome copy matches the tone above: selective-eating stress + hard-to-
      get help → calm home “investigating” with curiosity/games → better why-
      language; lay of the land Plan → Run → History/Insights; Suggest as
      guidance (Approve still required) — short panel, not a multi-step tour or
      personal history dump.
- [ ] Dismiss persists on the household server-side; subsequent `/me` (and
      login) returns `welcomeOrientationDismissed: true`; panel does not reappear
      in a fresh browser session for that household.
- [ ] Dismiss is idempotent; never blocks navigation or other signed-in views.
- [ ] OpenAPI documents the new field + dismiss path; version bump; web +
      mobile DTOs/clients synced.
- [ ] Unit + IT for accounts dismiss / `UserResponse`; web component/AuthShell
      coverage; ModularityTests pass.
- [ ] No `product-tour` spotlights, no native welcome UI, no Plan/Run/Insights
      catalog behavior changes.

## Tasks

- [ ] Backend (accounts): household dismiss column + service; extend
      `UserResponse`; dismiss endpoint; unit + IT.
- [ ] Contract: OpenAPI `UserResponse.welcomeOrientationDismissed` + dismiss
      path; version bump; web + mobile DTO/client sync.
- [ ] Web: welcome panel in AuthShell; dismiss wiring; loading/error; component
      + AuthShell tests.
- [ ] Docs: archive on `/pr` after ship.

## Open questions

Resolved:

- Persistence: **server-side, household-scoped** (not localStorage / per-parent).
- Shape: **one dismissible panel**, not `product-tour`.
- Placement: **AuthShell** after auth (all tabs), not Plan-only.
- Why / tone: parent-facing empathy (outing stress, scarce specialist help) +
  curiosity-led ritual + descriptive “why” language; no personal biography in
  the UI.

Accepted risk:

- No “show welcome again” control in Settings for v1.
- Copy is curated static strings (no CMS / A-B); final wording may be tuned in
  the implement PR against this tone guide.
