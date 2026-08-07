# Spec: secrets-scan-ci

Status: archived  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement  
Parent: [docs/roadmap.md](../../roadmap.md)

## Problem

API keys, passwords, and connection strings can accidentally land in commits and
reach GitHub. Soft beta / prod hosting raises the cost of a leak. Path-filtered
backend/web/mobile CI does not scan for secrets, so a docs-only or missed-file PR
can merge credentials with a green check. CI should fail PRs that introduce
high-entropy secrets.

## Non-goals

- Full SAST / CodeQL suite (optional later)
- Dependency CVE or license scanning (`dependency-vuln-ci` / `dependency-license-ci`)
- Proving AI-generated code is free of training-data copies (not solvable by this)
- Paid GitHub Advanced Security product setup (nice if free on the repo; not
  required for this slice)
- Pre-commit hooks on developer machines (optional later; CI is the merge gate)
- Rewriting git history to purge existing secrets (operator runbook only if a
  real finding exists on `main`)
- OpenAPI / product feature work
- TruffleHog or other scanners in the same PR (pick **one**: gitleaks)

## Approach

**CI-only.** Add `.github/workflows/secrets.yml` that runs **gitleaks** on every
`pull_request` and every `push` to `main` with **no path filter** (secrets can
appear in any path).

Use the maintained gitleaks GitHub Action, pinned to a release tag (not
`@main` / `@master`). Checkout with enough history for the action’s PR mode
(follow action docs; typically `fetch-depth: 0`).

If a clean tree trips known false positives, add a minimal root `.gitleaks.toml`
allowlist in the **same** PR — only for documented benign patterns (e.g. test
fixtures), never to silence real credentials.

Update the CI table in `docs/architecture.md` with one row for the secrets
workflow and a short note that this job is not path-filtered. Requiring the
`secrets` status check in branch protection is operator follow-up after the first
green run (do not change GitHub settings from this PR).

**Contract:** none. **Backend / web / mobile product code:** none.

## Acceptance criteria

- [x] `.github/workflows/secrets.yml` exists and runs gitleaks on
      `pull_request` and `push` to `main` with **no** path filters.
- [x] The workflow uses a pinned gitleaks Action version (not a floating `@main`
      or `@master` ref).
- [x] A PR that only changes docs still triggers the secrets workflow.
- [x] Job fails (non-zero) when gitleaks reports findings; passes on a clean
      scan of the current tree (or after a documented allowlist entry for a
      proven false positive).
      *(Verified clean scan locally with gitleaks v8.28.0; fail-on-findings is
      default gitleaks-action behavior.)*
- [x] `docs/architecture.md` CI table lists the secrets workflow.
- [x] No OpenAPI version bump; web/mobile/backend product modules unchanged
      aside from optional `.gitleaks.toml` + architecture note.

## Tasks

- [x] CI: Add `.github/workflows/secrets.yml` (gitleaks, PR + push to `main`,
      no path filters, pinned action).
- [x] CI/docs: Update `docs/architecture.md` CI table (and a short note that
      this job is not path-filtered).
- [x] Tests: Structural assertion that `secrets.yml` exists, has no `paths:`
      filter under `on:`, and references gitleaks (same spirit as
      `OpenApiContractTest.backendWorkflowPathFiltersIncludeContracts`).
- [x] Optional: Add `.gitleaks.toml` only if the first clean CI run fails on
      false positives; document each allowlist rule in the PR body.
      *(Skipped — local gitleaks v8.28.0 scan of current history: no leaks.)*
- [x] Contract: **none**.
- [x] Backend product: **none**.
- [x] Web: **none**.
- [x] iOS: **none**.

## Open questions

- **gitleaks Action tag** — pin the latest stable at implement time; do not
  invent a dependency beyond the Action + optional config file.
- **Branch protection** — requiring the `secrets` status check is operator
  follow-up after the first green run (same pattern as backend/web/mobile).
