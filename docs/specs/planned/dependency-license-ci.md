# Spec stub: dependency-license-ci

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec dependency-license-ci`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

A transitive GPL/AGPL (or other disallowed) library can create reciprocal-license
obligations. Soft beta can rely on manual awareness; formal beta should fail CI
when a dependency license is outside an allowlist (e.g. MIT/Apache-2.0/BSD).

## Non-goals (sketch)

- Scanning AI-generated *source* for copyrighted snippets (no reliable free tool)
- Legal advice / license opinion letters
- Vulnerability CVEs (`dependency-vuln-ci`)

## Notes

- npm: `license-checker` / similar; Gradle: license-report plugin or FOSS
  equivalent. Start with fail-on-copyleft; document allowlist exceptions.
- This covers **declared dependency licenses**, not model regurgitation.
