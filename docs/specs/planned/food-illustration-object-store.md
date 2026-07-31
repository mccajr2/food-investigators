# Spec stub: food-illustration-object-store

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-31  
Added: 2026-07-31 · re-rank split (from `on-demand-food-illustrations`)

Thin stub from `/roadmap`. **Not implementable yet.** Run
`/spec food-illustration-object-store` to flesh out Approach, Acceptance Criteria,
and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

On-demand food art needs durable storage and a way for **multiple households to
reuse the same illustration** (same food / same normalized key) instead of
regenerating per family. Today foods only store `iconKey` — no shared image
URL/blob surface.

## Non-goals (sketch)

- Offline starter PNG redraws (`non-hero-food-illustrations`, heroes)
- Calling an image model / generate UX (`on-demand-food-illustrations`)
- Runtime AI in Run why-chips

## Notes

- Depends on / follows finishing starter sticker completeness if dashboard-first
  (`non-hero-food-illustrations`); can land before generate.
- Likely: object store (provider TBD at `/spec`), content-addressed or
  canonical-key cache, OpenAPI `iconUrl` (or equivalent) on food responses,
  web + mobile clients prefer URL when present; heroes/static stay bundled.
- Shared reuse is a hard requirement — not per-household private blobs only.
- Confirm provider (S3-compatible / R2 / etc.), auth for reads, and keying
  strategy at `/spec`.
