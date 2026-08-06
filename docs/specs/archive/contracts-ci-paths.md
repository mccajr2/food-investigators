# Spec: contracts-ci-paths

Status: done  
Created: 2026-08-04  
Added: 2026-08-04 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

OpenAPI lives in `contracts/openapi.yaml`, but GitHub Actions path filters for
`backend.yml` (and the other workflows) omit `contracts/**`. A contracts-only PR
can merge with **no CI jobs**, so `OpenApiContractTest` never runs and schema
drift can land green. Soft beta and a growing team need contract edits to always
trigger the existing OpenAPI checks.

## Non-goals

- Full OpenAPI codegen for web/mobile
- Spectral lint, or controller↔OpenAPI diff tooling beyond what
  `OpenApiContractTest` already asserts
- Adding `contracts/**` to `web.yml` / `mobile.yml` (those suites do not load the
  YAML; client sync remains a same-PR process rule in `AGENTS.md`)
- Changing OpenAPI content or bumping the contract version in this slice
- `secrets-scan-ci` or other supply-chain CI (separate backlog ids)

## Approach

**CI-only.** Add `contracts/**` to the `paths` filters on
`.github/workflows/backend.yml` for both `push` and `pull_request`, so a change
under `contracts/` runs `./gradlew :backend:test` (includes
`OpenApiContractTest`, which resolves `contracts/openapi.yaml` from the repo
root).

Keep the test as-is unless path resolution fails in CI after the filter change
(it already supports both `contracts/openapi.yaml` and `../contracts/…` from
`backend/`). No OpenAPI edits. Document the filter in a one-line note on the
archived path-filtered-ci approach only if something already documents filters;
prefer not adding new docs unless needed for the AC.

**Contract:** none (CI wiring only). **Web / iOS / backend product code:** none.

## Acceptance criteria

- [x] `.github/workflows/backend.yml` `push` and `pull_request` `paths` include
      `contracts/**`.
- [x] A PR that only touches `contracts/**` (and/or this workflow file) causes the
      **backend** workflow to run (path filter match).
- [x] `OpenApiContractTest` remains part of `:backend:test` and still resolves
      `contracts/openapi.yaml` when tests run from the Gradle backend project.
- [x] No OpenAPI version bump; no product code changes in web/mobile/backend
      modules beyond CI config (and a test-only fix if path resolution breaks).
- [x] Web and mobile workflow path filters are **unchanged** in this PR.

## Tasks

- [x] CI: Add `contracts/**` to `.github/workflows/backend.yml` path filters
      (push + pull_request).
- [x] Tests: Confirm `OpenApiContractTest` still finds the YAML locally via
      `./gradlew :backend:test --tests OpenApiContractTest` (fix only if broken).
- [x] Contract: **none**.
- [x] Backend product: **none**.
- [x] Web: **none**.
- [x] iOS: **none**.

## Open questions

- None for v1 — backend workflow is the sole owner of OpenAPI file checks today.
  If later we want web client tests on every contract edit, that is a separate
  slice (and still would not replace `OpenApiContractTest`).
