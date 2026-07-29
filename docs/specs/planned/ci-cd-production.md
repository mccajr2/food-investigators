# Spec stub: ci-cd-production

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-29  
Added: 2026-07-29 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec ci-cd-production`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

## Problem

Manual deploys to Render will drift and slow beta fixes. After tests pass on
`main`, CI should deploy backend and web to the beta production services.

## Non-goals (sketch)

- First-time service provisioning (`beta-backend-hosting` / `beta-web-hosting`)
- Deploy-from-PR preview environments (unless cheap and needed)
- Mobile CI publishing

## Notes

- Today’s workflows only test (path-filtered); deploy was deferred in
  `path-filtered-ci`.
- Gate deploy on green web + backend checks; secrets via GitHub Actions.
- Ranked after both hosting slices exist.
