# Spec stub: secrets-scan-ci

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec secrets-scan-ci`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

API keys, passwords, and connection strings can accidentally land in commits and
reach GitHub. Soft beta / prod hosting raises the cost of a leak. CI should fail
PRs that introduce high-entropy secrets.

## Non-goals (sketch)

- Full SAST / CodeQL suite (optional later)
- Dependency CVE or license scanning (`dependency-vuln-ci` / `dependency-license-ci`)
- Proving AI-generated code is free of training-data copies (not solvable by this)

## Notes

- Prefer free OSS in Actions: **gitleaks** (or TruffleHog); enable GitHub secret
  scanning if the repo is public.
- Soft-beta gate (rank 5); do not block hosting specs on this, but ship before
  friend invites if the remote is public.
