# Spec stub: contracts-ci-paths

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-04  
Added: 2026-08-04 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec contracts-ci-paths`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

OpenAPI lives in `contracts/` but path-filtered CI can skip all jobs on a
contracts-only PR, so client/schema drift can merge green. Soft beta and a
growing team need `contracts/**` changes to actually run OpenAPI checks.

## Non-goals (sketch)

- Full OpenAPI codegen for web/mobile (later / P2)
- Spectral + controller↔OpenAPI diff suite beyond a minimal harden if needed
- AuthShell split or Modulith SPI narrowing

## Notes

- Soft-beta insurance (rank after ritual polish; can parallelize).
- Likely touches `.github/workflows/*` path filters + keep/extend
  `OpenApiContractTest`.
