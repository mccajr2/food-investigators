# Spec: why-chip-illustrations

Status: done  
Created: 2026-07-30  
Parent: [docs/roadmap.md](../../roadmap.md)  
Added: 2026-07-30 · re-rank split (from `ritual-illustrations`)  
Depends on: [run-survey-shorten](./run-survey-shorten.md) (why chips + v1 `whyChipIcons`)  
Completed: 2026-07-30

## Problem

Why-chip icons shipping with `run-survey-shorten` are abstract / emoji-like. A
5–6 year old often cannot tell what a chip means without a parent narrating,
even though text labels are present. The ritual needs **kid-clear cartoon**
illustrations so recognition is mostly visual, with labels as backup.

## Non-goals

- Food / snack / catalog illustrations (follow-on: `food-illustrations-ai`)
- Runtime or online generative AI in Run (assets are AI-*assisted* **offline**,
  then committed as static files)
- Changing chip label strings, chip sets, or `whyNote` encoding
- OpenAPI / backend / native iOS changes
- Reward mini-game art
- Redesigning chip layout (icon + text stays; no new interaction model)

## Approach

**Web-only.** Replace the v1 React SVG why-chip icons with a locked **realistic
cartoon** art direction (see [why-chip art brief](../../design/why-chip-art-brief.md)
— offline AI style guide / prompt pack so all chips feel like the same world).
Commit static assets (SVG preferred; PNG/WebP OK if SVG quality fails) and map
every `WHY_CHIPS_BY_LIKED` string to an illustration.

**Kid-clarity rule:** a 5-year-old should recognize the idea at a glance. Shared
motifs across like / no / so_so are allowed only when **polarity is visually
obvious** without reading (e.g. same “crunch” shape with happy vs “too much”
cues). If sharing would confuse, use distinct art per string.

Wire through the existing why-chip icon module from `run-survey-shorten` (do not
reintroduce a second icon path). Brand palette stays aligned with logo tokens
where fills are needed; do not invent a new product palette.

No contract changes.

## Acceptance criteria

- [x] Every why-chip string in `WHY_CHIPS_BY_LIKED` (like / no / so_so) renders an
      illustration **and** its text label on the Run why step.
- [x] Illustrations share one locked cartoon art direction (not mixed emoji +
      abstract + realistic styles).
- [x] Polarity is kid-obvious: like vs no variants for the same sense are not
      identical art with only the label differing.
- [x] Assets are static (committed); Run does **not** call an AI API to draw chips.
- [x] Chip selection / multi-select / `encodeWhyNote` behavior unchanged.
- [x] No OpenAPI, backend, iOS, food-icon, or reward-game changes in this PR.
- [x] Tests: each chip key resolves to a non-empty icon; Run why step still shows
      label text for a representative chip from each liked set.

## Tasks

- [x] Web: lock a short offline art brief (style, palette, “readable at chip
      size”, polarity cues) used for all generations.
- [x] Web: produce/replace assets for all why-chip strings; map them in the
      existing why-chip icon module.
- [x] Web: keep labels visible; verify like / no / so_so sets on Run.
- [x] Tests: icon map coverage for every chip string; Run why-step assertion that
      icon + label render (extend `whyChipIcons` / `RunSessionPage` tests).
- [x] Docs: leave `food-illustrations-ai` planned stub for the food follow-on.

## Open questions

- None — shipped with `run-survey-shorten` Run foundation in the same PR when
  #33 was still open.
