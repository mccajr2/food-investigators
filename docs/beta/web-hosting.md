# Soft beta — web hosting (Render Static Site)

Step-by-step operator guide for the **prod lane** web UI. Local lane stays
`cd web && npm run dev` (Vite proxies `/api` → local backend) — see
[local-smoke-test.md](local-smoke-test.md).

API must already be live: [backend-hosting.md](backend-hosting.md).

Code/config for this guide: fail-closed `VITE_API_BASE_URL` in production
builds (`web/src/config.ts`), Static Site entry in `render.yaml`
(`beta-web-hosting`). You can create the site from the dashboard **or** apply
the Blueprint and fill `VITE_API_BASE_URL` / API CORS in the UI.

---

## What you will end up with


| Piece                  | What it is                                                 | Where you find the URL / value                                  |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Render **Static Site** | Hosted Vite `dist/` (Plan + Run in the browser)            | Render → static site → **URL** (`https://….onrender.com`)       |
| `VITE_API_BASE_URL`    | Prod API origin baked into the JS bundle at **build** time | Same as API service URL from backend hosting (no `/api` suffix) |
| API CORS               | Allows the Static Site origin to call `/api/**`            | API service env `APP_CORS_ALLOWED_ORIGINS`                      |


**Do not** create a free **Web Service** for the UI. That sleeps and shows
Render’s “waking up” banner. **Static Site only.**

**Do not** put UptimeRobot on the web URL. Keep API keep-alive on
`/actuator/health` only ([backend-hosting.md](backend-hosting.md) §4).

---



## 0. Prerequisites

- [x] API deploy healthy: `curl https://YOUR-API.onrender.com/actuator/health` → `{"status":"UP"}`
- [x] You know the API origin (copy from Render → API service → URL), e.g.
  `https://food-investigators-api.onrender.com` — **no trailing slash**, no `/api`
- [x] This repo on `main` (or the branch Render builds) includes the
  `beta-web-hosting` fail-closed config
- [x] Render GitHub access granted for the repo (avoid “don’t have access” clone warnings)

---



## 1. Create a Render Static Site (not Web Service)

1. Open [dashboard.render.com](https://dashboard.render.com).
2. **New** → **Static Site**
  (If you only see “Web Service”, you are in the wrong flow — go back.)
3. Connect the GitHub repo `food-investigators` (or your fork).
4. Configure:

  | Field             | Value                              |
  | ----------------- | ---------------------------------- |
  | Name              | e.g. `food-investigators-web`      |
  | Branch            | `main` (after this feature merges) |
  | Root Directory    | `web`                              |
  | Build Command     | `npm ci && npm run build`          |
  | Publish Directory | `dist`                             |

5. **Environment** (build-time — required):

  | Key                 | Value                                     |
  | ------------------- | ----------------------------------------- |
  | `VITE_API_BASE_URL` | `https://YOUR-API.onrender.com` (from §0) |

   Without this, the production build **fails** on purpose (no silent localhost).
6. Create / deploy. Wait for the build to finish green.



### SPA routing (hard refresh)

In the Static Site settings, add a **Rewrite** (or Redirect rule, depending on
Render’s UI wording):


| Source | Destination   | Action  |
| ------ | ------------- | ------- |
| `/*`   | `/index.html` | Rewrite |


So `/plan`, `/run`, etc. still load the app after a refresh.

---



## 2. Find the public web URL

1. Open the Static Site in Render.
2. Copy the public URL at the top, e.g.
  `https://food-investigators-web.onrender.com`.
3. Save it — friends use this URL (laptop + iPad Safari).

There is **no separate “port”** for the Static Site. HTTPS is on 443; you never
set `PORT` for static hosting.

---



## 3. Allow CORS on the API (required or the browser blocks login)

The web origin and API origin differ (`….onrender.com` vs `….onrender.com` on
different subdomains), so the API must allowlist the web origin.

1. Render → **API** Web Service (Docker) → **Environment**.
2. Set (exact origin, `https`, **no** path, no trailing slash):
  ```text
   APP_CORS_ALLOWED_ORIGINS=https://food-investigators-web.onrender.com
  ```
   If you already have other origins, comma-separate:
3. **Save** → Manual Deploy / restart the API so the env is picked up.
4. Localhost Vite origins remain allowed automatically; you do not need to list
  them.

Details: [backend-hosting.md](backend-hosting.md) env table.

---



## 4. Smoke test from the hosted URL

1. Open the Static Site URL on your laptop.
2. **Create account** / sign in (use a throwaway email).
3. Confirm you land in the signed-in shell (Plan / Foods / etc.).
4. Optional: open the same URL on an iPad/Safari — Run layout should load.
5. If the browser console shows CORS errors:
  - Re-check `APP_CORS_ALLOWED_ORIGINS` matches the web URL **exactly**
  - Confirm API restarted after the env change
6. If the build failed with `VITE_API_BASE_URL must be set`:
  - Add the env on the Static Site and **Clear build cache / Redeploy**

---



## 5. Local vs prod cheat sheet


|                     | Local                             | Prod (soft beta)                                        |
| ------------------- | --------------------------------- | ------------------------------------------------------- |
| Web                 | `cd web && npm run dev`           | Render **Static Site**                                  |
| API calls           | Same-origin `/api` via Vite proxy | Absolute `VITE_API_BASE_URL`                            |
| `VITE_API_BASE_URL` | Leave empty                       | **Required** at build time                              |
| CORS                | N/A (proxy)                       | Set `APP_CORS_ALLOWED_ORIGINS` on API                   |
| Keep-alive          | N/A                               | API only (`/actuator/health`) — **not** the Static Site |


---



## 6. How to promote a web hotfix (until `ci-cd-production`)

1. Merge the fix to `main`.
2. Render → Static Site → **Manual Deploy** → latest commit
  (or auto-deploy from `main` if enabled on the site).
3. Confirm `VITE_API_BASE_URL` is still set (rebuild needs it every time).
4. Hard-refresh the site; smoke login again.

Changing **only** API code does not require a web rebuild unless the API URL
changed.

---



## 7. Troubleshooting


| Symptom                                      | Likely cause                       | What to do                                  |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------- |
| Build fails: `VITE_API_BASE_URL must be set` | Env missing on Static Site         | Add env → redeploy                          |
| Site loads, login fails (network / CORS)     | API CORS not set or wrong origin   | Fix `APP_CORS_ALLOWED_ORIGINS`, restart API |
| Login hangs / timeouts                       | API asleep                         | Confirm UptimeRobot on `/actuator/health`   |
| Refresh on `/plan` → 404                     | Missing SPA rewrite                | Add `/*` → `/index.html` rewrite            |
| “Waking up” banner on the **UI**             | Deployed as Web Service by mistake | Delete that service; use **Static Site**    |
| Old API URL in the bundle                    | Env changed but no rebuild         | Redeploy Static Site                        |


---



## 8. Operator checklist (ship gate)

- [x] Static Site (not Web Service) created with Root `web`, Publish `dist`
- [x] `VITE_API_BASE_URL` = API origin; build green
- [x] SPA rewrite `/*` → `/index.html`
- [x] Web URL recorded: `https://________________.onrender.com`
- [x] API `APP_CORS_ALLOWED_ORIGINS` includes that exact origin; API restarted
- [x] Signup/login works from the hosted URL (laptop)
- [ ] Spot-check on iPad Safari (optional but recommended for Run)
- [x] API UptimeRobot still on health only (no web monitor required)