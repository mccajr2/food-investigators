# Soft beta — backend hosting (Neon + Render + keep-alive)

Step-by-step operator guide for the **prod lane** API. Local lane stays
Compose Postgres + `bootRun` (see [local-smoke-test.md](local-smoke-test.md)).

Code/config for this guide: Actuator health, `PORT`, CORS env,
`Dockerfile`, optional `render.yaml` (`beta-backend-hosting`).

After the web Static Site exists, set `APP_CORS_ALLOWED_ORIGINS` to that
exact origin — see [web-hosting.md](web-hosting.md) §3.

---

## What you will end up with


| Piece               | What it is                       | Where you find the URL / value                                     |
| ------------------- | -------------------------------- | ------------------------------------------------------------------ |
| Neon DB             | Hosted Postgres                  | Neon **Connect** dialog → JDBC pieces                              |
| Render Web Service  | Running Spring Boot API          | Render dashboard → service → **URL** (`https://….onrender.com`)    |
| Health / keep-alive | `GET /actuator/health`           | `{Render URL}/actuator/health`                                     |
| Gemini key          | Suggest AI                       | Google AI Studio → API key                                         |
| Port                | Listen port inside the container | Render sets `PORT` (usually `8080`); you do not open a laptop port |


Static food/why-chip PNGs stay in `web/src/assets` (git). R2 is **optional** and
not required for soft beta.

---



## 0. Prerequisites

- GitHub repo with this code on `main` (or the branch Render builds).
- Accounts (free tiers are OK for soft beta):
  - [Neon](https://neon.tech)
  - [Render](https://render.com)
  - [Google AI Studio](https://aistudio.google.com/) (Gemini)
  - [UptimeRobot](https://uptimerobot.com) (or any HTTP monitor)

---



## 1. Create Neon Postgres (database URL + user + password)

1. Sign in at [console.neon.tech](https://console.neon.tech).
2. **New Project** → name it e.g. `food-investigators-beta`.
3. **Region:** pick the same cloud region you will use on Render (e.g. both
  `Oregon` / `US West`) to keep latency low. Write the region down in a note.
4. After the project opens, click **Connect** on the dashboard.
5. In the Connect modal:
  - Set client / language to **Java** if offered (or “connection string”).
  - Prefer the **pooled** connection host if Neon shows pooler vs direct
  (fine for a single Boot app).
6. You will see a URI like:
  ```text
   postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
  ```
   Split it into **three** Render env vars (do not paste the full URI into git):

  | Env var                      | How to fill it                                       |
  | ---------------------------- | ---------------------------------------------------- |
  | `SPRING_DATASOURCE_USERNAME` | `USER` from the URI                                  |
  | `SPRING_DATASOURCE_PASSWORD` | `PASSWORD` from the URI (URL-decode if it has `%xx`) |
  | `SPRING_DATASOURCE_URL`      | `jdbc:postgresql://HOST/DBNAME?sslmode=require`      |

   Example shape (fake values):
7. Keep the Neon password in a password manager. **Never commit it.**

Flyway runs automatically on Boot startup (`ddl-auto: validate`). The first
successful boot against an empty Neon DB applies all `V*__*.sql` migrations.

---



## 2. Create a Gemini API key (Suggest)

Required for AI Plan suggestions in prod. Locally you can leave it blank and
use the heuristic fallback.

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with the Google account you want for this project.
3. Open **Get API key** / **API keys** (sidebar or account menu — label varies).
4. **Create API key** → choose or create a Google Cloud project if prompted.
5. Copy the key once into your password manager.
6. You will set Render env: `GEMINI_API_KEY=<paste>`.

Optional later (defaults are already in `application.yaml`):

- `GEMINI_MODEL` (default `gemini-3.5-flash`)
- `GEMINI_API_BASE_URL`

---



## 3. Deploy the API on Render (URL + PORT)



### 3a. Create the Web Service

**Option A — Blueprint (repo has** `render.yaml`**):**

1. Render dashboard → **New** → **Blueprint**.
2. Connect the GitHub repo `food-investigators` (or your fork).
3. Select branch `main` (after this feature merges) → apply.
4. Render creates `food-investigators-api` from `Dockerfile`.

**Option B — Manual Web Service:**

1. Render → **New** → **Web Service**.
2. Connect the same GitHub repo + branch.
3. Runtime: **Docker**.
4. Dockerfile path: `./Dockerfile` (repo root).
5. Instance type: **Free** is OK for soft beta (sleeps when idle).



### 3b. Find the public URL and port

1. Open the service in Render.
2. At the top you will see a public URL, e.g.
  `https://food-investigators-api.onrender.com`.
   That is your **API base URL** (no path). Save it.
3. **Port:** Render injects env var `PORT`. Our app binds with
  `server.port: ${PORT:8080}`. You normally **do not** set a custom public
   port — HTTPS terminates at Render and forwards to `$PORT` inside the
   container (often `8080`). Leave `PORT` as Render provides it (Blueprint
   sets `8080` as a default value; Render may override).



### 3c. Set environment variables (dashboard)

Service → **Environment** → add (mark secrets as secret):


| Key                          | Required?           | Value                                                         |
| ---------------------------- | ------------------- | ------------------------------------------------------------- |
| `SPRING_DATASOURCE_URL`      | **Yes**             | Neon JDBC URL from §1                                         |
| `SPRING_DATASOURCE_USERNAME` | **Yes**             | Neon user                                                     |
| `SPRING_DATASOURCE_PASSWORD` | **Yes**             | Neon password                                                 |
| `GEMINI_API_KEY`             | **Yes** for Suggest | From §2                                                       |
| `PORT`                       | Usually auto        | `8080` if you must set it                                     |
| `APP_CALENDAR_ZONE`          | Nice                | e.g. `America/New_York`                                       |
| `APP_CORS_ALLOWED_ORIGINS`   | After web hosts     | `https://<your-web>.onrender.com` (set in `beta-web-hosting`) |
| `FOOD_ILLUSTRATIONS_*`       | No for soft beta    | Leave unset (static PNGs in web)                              |


Redeploy / restart after saving env vars.

### 3d. Confirm the API is up

From your laptop:

```bash
curl -sS "https://YOUR-SERVICE.onrender.com/actuator/health"
# expect: {"status":"UP"}
```

Register smoke (optional):

```bash
curl -sS -X POST "https://YOUR-SERVICE.onrender.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you+beta@example.com","password":"password1","rememberMe":true}'
```

First request after idle free-tier sleep can take **30–60+ seconds** — that is
normal until keep-alive is on.

---



## 4. UptimeRobot keep-alive (so free Render does not sleep forever)

Goal: hit health every few minutes so the service stays warm for friends.

1. Sign up at [uptimerobot.com](https://uptimerobot.com).
2. **Add New Monitor**.
3. Monitor type: **HTTP(s)**.
4. Friendly name: `food-investigators-api health`.
5. URL: `https://YOUR-SERVICE.onrender.com/actuator/health`
  (same URL as §3d — **no** API key, **no** Bearer token).
6. Monitoring interval: **5 minutes** (good soft-beta default; free tier allows
  this). If you hit plan limits, use 10 minutes and accept more cold starts.
7. Alert contacts: optional (email yourself on down).
8. Save. Wait for the first green check.

What success looks like: monitor stays **Up**; occasional cold start after you
pause the monitor is expected.

---



## 5. Local vs prod cheat sheet


|         | Local                                                 | Prod (soft beta)                                              |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| App     | `./gradlew :backend:bootRun`                          | Render Docker Web Service                                     |
| DB      | `docker compose up -d postgres` → `localhost:5432`    | Neon (`SPRING_DATASOURCE_*`)                                  |
| API URL | `http://localhost:8080`                               | `https://….onrender.com`                                      |
| Health  | `http://localhost:8080/actuator/health`               | `https://….onrender.com/actuator/health`                      |
| Secrets | `backend/.env` (gitignored; copy from `.env.example`) | Render Environment UI                                         |
| CORS    | localhost Vite always allowed                         | Add web URL via `APP_CORS_ALLOWED_ORIGINS` when web is hosted |


---



## 6. How to promote a hotfix (until `ci-cd-production`)

1. Merge the fix PR to `main`.
2. Render → service → **Manual Deploy** → **Deploy latest commit** (or enable
  auto-deploy from `main` in Render only — still not GitHub Actions).
3. Watch deploy logs until healthy.
4. `curl` `/actuator/health` again.
5. Tell UptimeRobot nothing special — it will resume checking.

---



## 7. Troubleshooting


| Symptom                             | Likely cause                                        | What to do                                                    |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| Deploy fails compiling              | Docker build / Java 25 image                        | Check Render build logs; ensure Dockerfile from repo root     |
| Boot crash: datasource              | Bad Neon URL/user/pass or missing `sslmode=require` | Re-copy Connect values; confirm three env vars                |
| Health 401                          | Old build without Actuator permit                   | Confirm `/actuator/health` (not `/api/...`)                   |
| Health 503 / DOWN                   | DB unreachable                                      | Neon project paused? Wrong region credentials?                |
| Suggest fails                       | Missing `GEMINI_API_KEY`                            | Add key; redeploy                                             |
| Browser CORS errors from hosted web | Web origin not allowlisted                          | Set `APP_CORS_ALLOWED_ORIGINS` to exact `https://` web origin |


---



## 8. Operator checklist (ship gate)

- [x] Neon project created; region noted
- [x] `SPRING_DATASOURCE_*` set on Render (secrets)
- [x] `GEMINI_API_KEY` set on Render
- [x] Service URL recorded: `https://________________.onrender.com`
- [x] `curl …/actuator/health` → `{"status":"UP"}`
- [x] UptimeRobot monitor every 5 minutes on that health URL → Up
- [x] `APP_CORS_ALLOWED_ORIGINS` set for the web Static Site origin