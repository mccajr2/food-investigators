# Soft beta plan — 2–3 friends

Coached soft beta for **2–3 families** (selective eaters welcome). Goal: learn
whether Plan → Run sticks ~**2 nights/week** for **3–4 weeks** — not polish every
edge or prove clinical value.

See also: [docs/roadmap.md](../roadmap.md) **Beta path**, readiness plan
(soft → formal).

## Who to invite

| Fit | Why |
|-----|-----|
| Parent you can text mid-week | Soft beta is **coached**, not cold |
| Child who will try a short tablet ritual | Run is the hard night |
| Honest about drop-off | “We quit after week 1” is gold |

Skip for now: strangers, therapists-as-testers, anyone expecting OT replacement
or App Store install.

**Target:** 2 ideal + 1 backup (3 max). More noise, less coaching quality.

---

## Before you invite (checklist)

| Gate | Done? |
|------|-------|
| Local [smoke test](local-smoke-test.md) green on the build you’ll host | ☐ |
| Merge open ship PRs; Flyway / OpenAPI clashes resolved | ☐ |
| `beta-backend-hosting` live (Neon + Render + keep-alive) — follow [backend-hosting.md](backend-hosting.md) | ☐ |
| `beta-web-hosting` live (Static Site → prod API) — follow [web-hosting.md](web-hosting.md) | ☐ |
| Prefer also: `soft-beta-ritual-polish` (Approve / Exit / Insights bridge / History) — if not shipped, coach around the sharp edges below | ☐ |
| You have a URL + one test account that works on your phone | ☐ |
| Coaching one-pager ready (below) — send with the invite | ☐ |

Do **not** wait on: new mini-games, stretch pathway, native iOS, AuthShell split.

---

## Coaching one-pager (send to friends)

Copy/adapt:

> **Food Investigators — soft beta**
>
> Thanks for trying this with us. It’s a calm tasting ritual, not a meal planner
> and not therapy. You’re in charge of what gets planned.
>
> **How we use it (aim for 2 nights/week):**
> 1. On a laptop: **Plan** → **Suggest next night** → glance → **Approve**
>    (prefer **one safe food + one stretch**, not two stretches).
> 2. On a tablet/browser: open the same site → **Run** when you’re ready.
> 3. Kid taps big buttons; **Skip** is OK on most questions. Games unlock when a
>    **stretch** food went well enough — try **Surprise**.
> 4. After a few nights: **Insights** tips + **History → Download PDF** if you
>    want something for a therapist later.
>
> **Please don’t:** treat Suggest as orders; grind the Foods screen unless
> something’s wrong; expect a new Mario-style game every night.
>
> **Please do tell me:** if you stopped — after how many nights, and why
> (too long at bedtime, weird Suggest, kid hated Run, site down, etc.).

---

## Week-by-week

### Week 0 — kickoff (30 min call or voice note)

- Share URL; watch them **Create account** once (or you create and hand off).
- Walk Suggest → Approve → show where **Run** is.
- Set expectation: first week is setup + 1–2 nights, not perfection.
- Agree a mid-week check-in channel (text).

### Weeks 1–3 — run the ritual

| Ask them to | You watch for |
|-------------|----------------|
| ~2 Suggest→Approve + Run nights / week | Did they Suggest or only manual Plan? |
| Prefer safe+stretch | Two-stretch marathon → coach shorter nights |
| Use Skip when the room is hot | Exit mid-Run — did they lose data / give up? |
| After night 3: open Insights once | Tips useful or ignored? |
| Optional: download History PDF once | Worth bringing to OT? |

**Your mid-week ping (example):** “Any night this week? Stuck on Plan, Run, or
the site?”

### Week 4 — wrap (15–20 min)

Same 5 questions for each family (write answers down):

1. Would you keep going another month? Why / why not?
2. Hardest step: Plan, Run, or something else?
3. Did Suggest help or get ignored?
4. Did the kid care about the games?
5. Anything confusing or broken?

Then decide: hotfix polish → **formal beta**, or re-rank roadmap from evidence.

---

## What you collect (lightweight)

No analytics dashboard required. A shared note per family:

| Field | Example |
|-------|---------|
| Nights completed (approx) | 5 |
| Used Suggest? | Yes / mostly manual |
| Dropped off? | After night 2 — Run too long |
| Site / login issues | Cold start once |
| Keep going? | Maybe with shorter Run |
| Quote | “We only lasted when I skipped half the questions” |

---

## Success / fail signals

**Soft beta “worked” if:**

- ≥2 families finish **≥4 nights** in 3–4 weeks, **or**
- Clear, repeated reason for quitting (actionable), even if retention is low

**Soft beta “not ready for formal” if:**

- Site flaky / can’t sign in
- Nobody finishes a Run without you on the phone
- Suggest is universally ignored *and* manual Plan feels unbearable

---

## Formal beta (later — don’t expand yet)

After soft beta + polish from feedback (roadmap ranks 5–9): badges, surprise
nudge, CI/CD, AuthShell split, outcome contract — then a **colder** invite
(slightly larger, less hand-holding). Stretch depth and native Run wait on
evidence.

---

## Invite template

> Hey — we’re doing a tiny soft beta of Food Investigators (tasting ritual for
> picky eaters). Looking for 2–3 families for ~3–4 weeks, ~2 short nights a
> week. I’ll coach you; it’s not therapy and it’s rough around the edges.
> Interested? I’ll send a link + a one-page how-we-use-it note.
