# Local manual smoke test

Pass/fail checklist for a full parent ritual on a laptop (and optionally an iPad
browser). Use a **fresh email** each full run so signup stays clean.

**Branch note:** Stretch targets exist on `stretch-food-targets` (PR #52), not
necessarily on `main` / soft-beta branches. Mark §7 optional unless that code is
checked out.

## 0. Start the stack

From the repo root:

```bash
docker compose up -d postgres
./gradlew :backend:bootRun
```

In another terminal:

```bash
cd web
npm ci    # first time / after lockfile changes
npm run dev
```

| Check | Pass? |
|-------|-------|
| Postgres is up (`docker compose ps`) | ☐ |
| Backend healthy at `http://localhost:8080` (no boom on boot) | ☐ |
| Web at Vite URL (usually `http://localhost:5173`) | ☐ |

Optional API sanity (no UI):

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-'$(date +%s)'@example.com","password":"password1","rememberMe":true}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s "http://localhost:8080/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

Expect JSON with `email`, `householdId`, `welcomeOrientationDismissed: false`.

---

## 1. Signup (new user)

Open the web app → **Create account**.

| Step | Expected | Pass? |
|------|----------|-------|
| Enter unique email + password (≥8 chars) | Fields accept input | ☐ |
| Optional **Child's first name** (e.g. Alex) | Saved for Plan/Run copy later | ☐ |
| **Safe foods** nudge: fill ~3–5 tasting foods (mix invent + a known starter if typeahead shows) | Rows editable; Skip still allowed | ☐ |
| Optionally **Add a snack** | Snack appears separately | ☐ |
| **Keep me logged in** checked (default) | Checkbox on | ☐ |
| Click **Create account** | Lands signed-in (email in header); Plan tab | ☐ |

---

## 2. Welcome orientation

| Step | Expected | Pass? |
|------|----------|-------|
| Welcome dialog appears (why + Plan → Run → Insights) | Heading **Welcome to Food Investigators** | ☐ |
| App chrome still usable underneath (Plan nav visible) | Not a hard gate | ☐ |
| Click **Got it** | Dialog disappears | ☐ |
| Hard refresh the page | Welcome does **not** return | ☐ |

---

## 3. Plan — Suggest → Approve

| Step | Expected | Pass? |
|------|----------|-------|
| **Suggest next night** | Draft appears with two foods, rationale / pace note | ☐ |
| Review date + slots (familiarity / variant if shown) | Editable if needed | ☐ |
| **Approve** | Night appears under Upcoming | ☐ |
| **Suggest** again for another night (or Dismiss a draft) | Dismiss does not create; second Approve adds another night | ☐ |

---

## 4. Plan — manual night

| Step | Expected | Pass? |
|------|----------|-------|
| **Plan a night** → pick a future date | Past / occupied dates blocked or greyed | ☐ |
| Food 1 = a **safe** exposure; Food 2 = **truly new** or **familiar but new** | Save succeeds | ☐ |
| Same food + two different variants (if you try) | Allowed; same food+variant twice rejected | ☐ |

---

## 5. Run — stretch + safe night

Prefer an Upcoming night with **one safe + one stretch**. Use a tablet-width window or iPad Safari → `localhost:5173` if useful.

| Step | Expected | Pass? |
|------|----------|-------|
| Click **Run** on tonight / early-run confirm if date is future | Fullscreen **Run tasting session** | ☐ |
| Safe food: liked → why → ate enough | Shorter path; Skip works on liked/why | ☐ |
| Stretch food: liked → why → texture → tastes → ate enough | Longer path; ate enough required | ☐ |
| If stretch **ate enough**: reward → pick **Surprise** (or Catch/Cross/Match) → play → **Done** | Game runs ~30s; can exit with Done | ☐ |
| If only safe ate enough: encourage, **no** game | Habit / try-again copy | ☐ |
| Parent notes: add a line or **Skip** | Returns to Plan | ☐ |

### Exit path (separate run or mid-flow)

| Step | Expected | Pass? |
|------|----------|-------|
| Start Run → **Exit** mid-survey | Leaves Run (today: may discard partial — note behavior) | ☐ |

---

## 6. Early-run confirm

| Step | Expected | Pass? |
|------|----------|-------|
| Plan a night for **tomorrow** → click **Run** today | Dialog **Run this night early?** | ☐ |
| **Not now** | Stays on Plan; night unchanged | ☐ |
| **Run** again → **Record as today and run** | Session date becomes today; Run starts | ☐ |

---

## 7. Foods (maintenance)

| Step | Expected | Pass? |
|------|----------|-------|
| **Foods** tab loads lists (starters / tasting / snacks / known safes) | No crash; empty states OK | ☐ |
| Mark or clear a **safe**; add an exposure if UI offers | Persists after refresh | ☐ |
| **Optional (stretch branch only):** add / remove a stretch target | Soft cap / invent OK | ☐ |

---

## 8. Insights

Complete **3** nights total (Suggest/manual + Run to complete) if not already.

| Step | Expected | Pass? |
|------|----------|-------|
| Nights 1–2: Insights shows not-ready empty state | Clear copy | ☐ |
| After 3 completed: aggregates + tips + recent whys | Cards populate | ☐ |
| **Dismiss** a tip | Tip gone after refresh | ☐ |

---

## 9. History + PDF

| Step | Expected | Pass? |
|------|----------|-------|
| History lists completed nights newest-first | Open a detail | ☐ |
| Date filter From/To / Clear | Filters list | ☐ |
| **Download PDF** | File downloads; opens with foods + outcomes + notes | ☐ |

---

## 10. Settings, logout, login

| Step | Expected | Pass? |
|------|----------|-------|
| **Settings** → change child name → **Save** | Plan/Run copy updates | ☐ |
| **Clear** name | Generic copy returns | ☐ |
| **Sign out** | Auth card; not signed in | ☐ |
| **Sign in** with same email/password (remember me on/off once each) | Restores session; **no** welcome again | ☐ |
| Wrong password | Error message; stay signed out | ☐ |

---

## Smoke result

| Area | Pass? | Notes |
|------|-------|-------|
| Signup + welcome | ☐ | |
| Suggest → Approve + manual Plan | ☐ | |
| Run (safe + stretch + reward) | ☐ | |
| Foods | ☐ | |
| Insights (≥3 nights) | ☐ | |
| History PDF | ☐ | |
| Settings / logout / login | ☐ | |

**Blockers found:**

-
-
