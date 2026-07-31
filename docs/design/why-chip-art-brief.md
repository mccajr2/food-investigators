# Why-chip art brief (locked)

Parent: [why-chip-sticker-art](../specs/archive/why-chip-sticker-art.md)  
Prior ship: [why-chip-illustrations](../specs/archive/why-chip-illustrations.md)
(so-so set: [so-so-why-detail](../specs/archive/so-so-why-detail.md))  
Locked: 2026-07-31 · PNG sticker + shared cream (match heroes)  
Audience: offline AI concept generation + **human polish** → PNG commit

Use this brief for **every** why-chip asset. Do not invent a second style
mid-set. Shared look with hero foods:
[food-icon art brief](./food-icon-art-brief.md) — one sticker sheet for the app.

Hero redraws and on-demand catalog AI are **out of scope** here.

## Style anchors (match these files)

Pass **several** locked hero PNGs under `web/src/assets/foods/` when generating
chips so outline weight, shine, and cream tile match. After the first why-chip
PNG locks, also pass peers from `web/src/assets/why-chips/`.

## Goal

A 5–6 year old should recognize the chip’s idea at a glance on an iPad Run
step (~40–48px). Text labels stay as backup — art must still work if the child
is not reading yet.

## Style profile (locked — same as heroes)

| Rule | Do | Don't |
|------|----|--------|
| Medium | Picture-book **sticker** | Photo, emoji, flat logo geometry |
| Shape | Organic, slightly uneven | Perfect hearts / crescents / circles |
| Outline | Thick **navy** `#153160` | Missing outline, rainbow strokes |
| Shine | One simple glossy highlight | Many speculars; missing shine when peers have it |
| Shadow | **None** under the subject | Soft oval / drop shadow on the tile |
| Detail | Sparse, **large** marks that survive 48px | Dense tiny marks |
| Color | Brand neighborhood; polarity via lime/coral motifs | Purple glow; inventing new product colors |
| Ground | Flat shared cream `#F7F2E3` for **every** chip | Polarity-tinted tile grounds; pink/mint outliers |
| Delivery | **PNG master ~256×256** | Geometric SVG rebuild that loses the vibe |

**No text inside the illustration** (UI shows the chip label).  
**No scary / gross close-ups** (yucky = clear “nope” cues, not vomit detail).

## Palette (brand neighborhood)

| Role | Hex | Use |
|------|-----|-----|
| Navy | `#153160` | Outlines (required), eyes, “too much” emphasis |
| Cream | `#F7F2E3` | **Required shared tile ground** for every chip |
| Lime | `#7AB953` | Positive / like accents |
| Coral | `#DE4E4B` | Negative / “yucky” / “too” accents |
| Amber | `#E48E26` | Warm, tasty, heat |
| Sky | `#5BB0D7` | Cool, soft, smell wisps |
| White | `#FFFEF8` | Highlights |

## Size & delivery

- Display ~40–48px; author **256×256 PNG** masters (derive 1x/2x/3x later for iOS).
- Path: `web/src/assets/why-chips/<slug>.png` where slug = label with spaces → `_`
  (e.g. `yummy smell` → `yummy_smell.png`).
- UI may apply `rounded-2xl` on the `<img>`; do not rely on baked soft tinted grounds.
- After AI concept: flatten any sneaky ground shadow; force cream `#F7F2E3`.

## Polarity (kid-obvious without reading)

Like / no variants for the **same sense** must not be identical art with only
the label different. So-so does **not** use a third “shrug / middling” art
style — it reuses like (good) and no (bad) chips; overall liked = so_so already
covers middling.

| Polarity | Visual cues |
|----------|-------------|
| **like** | Smile / open happy face, lime accents, “just right” amount |
| **no** | Frown / X / push-away, coral accents, “too much” or “yucky” exaggeration |
| **so_so** | No separate motifs — same art as the like / no string being shown |

Shared base motifs are allowed (e.g. same cracker for crunch) **only** when
like vs no polarity cues above are unmistakable at chip size.

## Chip inventory (must all get art)

Copy is locked in `web/src/components/run/whyChips.ts` — do not rename here.

### like

| Chip | Motif direction | File slug |
|------|-----------------|-----------|
| tasty | Happy taste — smile + yummy food cue | `tasty` |
| crunchy | Clear crunch (cracker / bite with crisp edges), happy | `crunchy` |
| soft | Soft pillow / cloud-soft food, happy | `soft` |
| yummy smell | Nose + pleasant steam/wisps, happy | `yummy_smell` |
| looks good | Eyes / sparkle on appealing food, happy | `looks_good` |
| warm | Gentle sun / warm glow (not burning) | `warm` |
| cold | Cool ice / frost, pleasant | `cold` |

### no

| Chip | Motif direction | File slug |
|------|-----------------|-----------|
| yucky taste | Tongue out / disgusted face + coral | `yucky_taste` |
| too crunchy | Same crunch family as like, but “too much” / hurt teeth cue | `too_crunchy` |
| too soft | Mush / droop vs like-soft, unhappy | `too_soft` |
| yucky smell | Nose + stinky wisps / coral X | `yucky_smell` |
| looks weird | Confused eyes + odd shape, not horror | `looks_weird` |
| too hot | Flame / sweat — hotter than like-warm | `too_hot` |
| too cold | Shiver / ice — colder / unpleasant vs like-cold | `too_cold` |

### so_so

Curated mix of existing labels (good then bad). **Reuse** the like / no
illustrations — do not generate shrug / neutral middling-only assets.

| Chip | Art source |
|------|------------|
| tasty | same as **like** |
| crunchy | same as **like** |
| soft | same as **like** |
| yummy smell | same as **like** |
| looks good | same as **like** |
| yucky taste | same as **no** |
| too crunchy | same as **no** |
| too soft | same as **no** |
| yucky smell | same as **no** |
| looks weird | same as **no** |

Temperature chips (warm / cold / too hot / too cold) stay on like / no only.

## Concept → lock workflow (per chip)

1. Generate **2 concepts** with the prompt pack + several style-anchor PNGs
   (heroes and any locked why-chips).
2. Parent picks by **A/B order** (don’t narrate pixels that may be wrong); revise
   once if needed.
3. Lock → resize 256, flatten shadow → cream `#F7F2E3`, commit PNG, map label→URL.
4. Next chip only after lock.

## Human-polish checklist (before commit)

1. Matches style anchors (navy outline, shine, shared cream `#F7F2E3` tile).
2. Reads at ~48px — sparse large details only.
3. No ground shadow; no polarity-tinted tile ground.
4. Like vs no polarity unmistakable without the label.
5. Filename = `<slug>.png`, ~256px, no watermark / no text in art.
6. Kid can guess the sense idea without reading the chip label.

## Offline generation prompt pack

Reuse this stem for every **like** / **no** chip; only swap the **Subject**
line. So-so needs no new generation.

```text
Children's picture-book STICKER for a food-tasting app why-chip.
MUST match the same sticker sheet as the Food Investigators hero food icons:
thick navy #153160 outline, one simple glossy highlight/shine, flat cream tile
exactly #F7F2E3 (shared by ALL chips — not pink, not mint, not polarity-tinted),
organic (not geometric) silhouette, NOT photoreal, NOT emoji.
NO drop shadow or oval under the subject.
Sparse large details only — must stay clear at 48px.
Brand colors neighborhood: navy #153160, cream #F7F2E3, lime #7AB953,
coral #DE4E4B, amber #E48E26, sky #5BB0D7, white #FFFEF8.
Square icon, centered, no text, no watermark, no purple glow.
Polarity: {like | no} using smile/lime vs frown/coral (or “too much” cues) —
polarity is in the MOTIF, not the tile background color.
Subject: {chip motif from like / no tables above}.
```

Attach several locked `web/src/assets/foods/*.png` (and locked why-chip PNGs) as
references. After polish: commit `web/src/assets/why-chips/<slug>.png` and map in
the why-chip icon module. Run must never call an AI API for these chips.
