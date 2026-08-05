# Spec stub: dependency-vuln-ci

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-05  
Added: 2026-08-05 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec dependency-vuln-ci`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Known CVEs in npm / Gradle dependencies can ship unnoticed. Formal beta and a
public GitHub need automated callouts (and preferably CI fail on high severity).

## Non-goals (sketch)

- Secret scanning (`secrets-scan-ci`)
- License allowlists (`dependency-license-ci`)
- Full pentest or WAF
- Blocking soft beta (enable Dependabot alerts as free ops earlier)

## Notes

- Free stack: **GitHub Dependabot** + `npm audit` and/or **Trivy** /
  OWASP dependency-check on backend in Actions.
- Formal-beta slice after soft-beta learnings.
