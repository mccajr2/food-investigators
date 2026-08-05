# Spec stub: soft-beta-ritual-polish

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-08-04  
Added: 2026-08-04 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec soft-beta-ritual-polish`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

Soft-beta families will abandon on hard nights before the product idea is wrong:
Suggest→Approve still feels like homework, Run Exit can lose a night’s data,
Insights tips don’t send parents back to Suggest, History still shows demoted
fields as “Skipped,” and two-stretch nights are too long without coaching toward
safe+stretch.

## Non-goals (sketch)

- New mini-game engines or Mario-like platformers
- Stretch-target pathway depth (`stretch-food-targets` / `stretch-pathway`)
- Native iOS Run
- AuthShell structural split (`authshell-split`)
- Full product tour (`product-tour`)

## Notes

- Soft-beta UX gate after hosting; before coached invite.
- Candidate AC bundle (confirm at `/spec`; split if too big): safe+stretch
  coaching copy; one-tap Approve when Suggest draft untouched; Exit
  warn/soft-save; Insights→Suggest CTA; hide demoted History temperature/smell.
- Depends on: `beta-backend-hosting`, `beta-web-hosting` (or ship polish in
  parallel once API URL exists).
