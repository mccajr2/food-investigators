# Spec stub: so-so-why-detail

Status: planned  
Parent: [docs/roadmap.md](../../roadmap.md)  
Created: 2026-07-30  
Added: 2026-07-30 · enhancement

Thin stub from `/roadmap`. **Not implementable yet.** Run `/spec so-so-why-detail`
to flesh out Approach, Acceptance Criteria, and Tasks before any code.

If fleshing out reveals more than one PR-sized slice, stop and `/roadmap` **split**
(`Added: … · re-rank split`) — do not grow this stub into a mega-spec.

## Problem

So-so is a gray area — often a mix of good and bad (liked the smell, not the
texture; taste was okay but not a favorite). The current so-so why chips are all
middling (“kind of tasty”, “okay smell”), so they cannot capture that mix. Pure
Like / No can stay focused on what was good or bad; so-so needs richer detail.

## Non-goals (sketch)

- Changing Like / No chip sets (keep polarity-focused)
- Clinical sensory panels or new OpenAPI fields for structured senses
- Runtime AI for chip suggestions

## Notes

- Likely expand `WHY_CHIPS_BY_LIKED.so_so` to include both positive and negative
  sense cues (and icons via existing why-chip art path). Confirm exact chip list
  at `/spec`.
- Insights chip-count tips should still make sense with mixed so-so notes.
- Depends on / follows `run-ux-polish` only for Back/Continue polish, not for
  chip content.
