# Spec: food-illustration-object-store

Status: archived  
Created: 2026-07-31  
Completed: 2026-07-31  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-31 · re-rank split (from `on-demand-food-illustrations`)  
Branch: `food-illustration-object-store`

## Problem

On-demand food art needs durable storage and a way for **multiple households to
reuse the same illustration** (same canonical food key) instead of regenerating
per family. Today foods only store `iconKey` — no shared image URL surface — and
Postgres is a poor long-term home for PNG blobs.

## Non-goals

- Offline starter / hero / why-chip PNG redraws (already shipped; starters stay
  **bundled** in the web app for this PR)
- Calling an image model or generate UX (`on-demand-food-illustrations`)
- Uploading the 26 starter masters into the bucket (optional later; not required)
- Runtime AI in Run why-chips
- Per-household private blobs as the only storage model (shared reuse is required)
- Paying for / configuring production R2/S3 in this PR if secrets are not ready —
  unconfigured mode must degrade gracefully (null `iconUrl`, local/test double)

## Approach

**S3-compatible object store + shared illustration registry + optional `iconUrl`
on food API responses.** Starters keep using bundled PNGs; remote URLs are for
shared/custom art that on-demand will write later.

### Storage

1. **Object store port** (foods module or a small shared infra module if needed
   without breaking Modulith): `put(key, bytes, contentType)`, `exists(key)`,
   `publicUrl(key)`.
2. **Provider:** S3-compatible API (Cloudflare R2 preferred for beta; AWS S3 OK).
   Config via env (endpoint, bucket, access key, secret, public base URL). When
   unconfigured → in-memory or local filesystem double for tests/dev; API returns
   null `iconUrl`.
3. **Dependency:** check `libs.versions.toml` first. If a new AWS/S3 client is
   required, **ask before adding** (AGENTS.md). Prefer the smallest workable
   client.

### Shared registry (Postgres — metadata only, not PNG bytes)

New table e.g. `food_illustrations`:

| column | purpose |
|--------|---------|
| `canonical_key` | PK — same as `iconKey` for customs (`custom_<slug>`) or agreed shared key |
| `object_key` | Path/key inside the bucket |
| `content_type` | e.g. `image/png` |
| `created_at` / `updated_at` | Audit |

No `household_id` — rows are **global**. Households reuse by pointing at the same
`canonical_key`.

### Contract

- Add optional nullable `iconUrl` (string URI) to OpenAPI:
  - `FoodResponse`
  - `SessionFoodResponse`
  - `SuggestedSessionFood`
- Update **web** and **mobile** clients in the same change (AGENTS.md).
- When a food’s `iconKey` has a `food_illustrations` row, responses include the
  public URL; otherwise `iconUrl` is null/omitted.

### Clients

- Web `FoodIcon`: if caller passes `iconUrl` (or food payload includes it), prefer
  remote `<img>`; else existing static PNG / emoji path.
- Mobile `FoodsClient` / food models: parse `iconUrl`; UI can ignore until a
  screen needs it, but the type must stay in sync.
- Plan/Run/Foods list endpoints that already return foods should surface
  `iconUrl` without a separate fetch.

### On-demand handoff

Expose an internal service API (not necessarily a public HTTP generate endpoint)
so `on-demand-food-illustrations` can: put PNG → upsert `food_illustrations` →
foods with that `iconKey` start returning `iconUrl`. This PR may include a thin
`FoodIllustrationService.store(canonicalKey, pngBytes)` used only from tests
(and later on-demand).

## Acceptance criteria

- [x] S3-compatible store port exists with a working test/local double when cloud
      credentials are absent.
- [x] Shared `food_illustrations` (or equivalent) table stores metadata keyed by
      `canonical_key` with **no** household ownership.
- [x] OpenAPI + web + mobile: optional `iconUrl` on `FoodResponse` (and session /
      suggestion food schemas that already carry `iconKey`).
- [x] When a registry row exists for a food’s `iconKey`, list/get food responses
      include a usable `iconUrl`; otherwise null and clients behave as today.
- [x] Web `FoodIcon` prefers `iconUrl` when provided; static starters and customs
      without a URL unchanged.
- [x] Two households / two foods sharing the same `canonical_key` resolve to the
      **same** `iconUrl` (unit or integration test).
- [x] No image-model calls; starters are not required to be uploaded to the bucket.
- [x] Tests: store double put→url; registry lookup; OpenAPI contract test; Foods
      client tests web + mobile for `iconUrl`.

## Tasks

- [x] Contract: optional `iconUrl` on food-related response schemas; regenerate /
      hand-update OpenAPI consumers checklist.
- [x] Backend: Flyway `food_illustrations`; store port + config; illustration
      service; map `iconUrl` on food (and session/suggestion) responses; tests
      including shared-key reuse.
- [x] Web: types + `FoodIcon` URL path; foods client tests.
- [x] Mobile: `FoodResponse` / related models + client tests for `iconUrl`.
- [x] Docs: env example keys for S3/R2; note unconfigured graceful null.
- [x] Docs: on ship, archive this spec; Next up stays
      `on-demand-food-illustrations`.

## Open questions

- None blocking `/implement` after approval.
  (Exact R2 vs AWS account can wait until beta hosting secrets exist; code must
  run with the local/test double.)
