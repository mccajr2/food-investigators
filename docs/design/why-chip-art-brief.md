# Why-chip art brief (locked)

Parent: [why-chip-illustrations](../specs/active/why-chip-illustrations.md)  
Locked: 2026-07-30  
Audience: offline AI image/SVG generation + hand polish before commit

Use this brief for **every** why-chip asset in this feature. Do not invent a
second style mid-set. Food / catalog art is **out of scope** here
(`food-illustrations-ai`).

## Goal

A 5–6 year old should recognize the chip’s idea at a glance on an iPad Run
step. Text labels stay on every chip as backup — art must still work if the
child is not reading yet.

## Style (one world)

- **Realistic cartoon** — soft rounded forms, clear silhouettes, friendly food /
  sense metaphors. Think picture-book sticker, not emoji, not flat geometric
  glyphs, not photoreal food photography.
- **Consistent line weight** and lighting across the set (gentle fill + simple
  navy outline or soft shade — pick one and keep it).
- **No mixed media** in the set (do not mix emoji, abstract shapes, and
  realistic cartoons).
- **No text inside the illustration** (the UI already shows the chip label).
- **No scary / gross close-ups** (yucky = clear “nope” cues, not vomit detail).

## Palette (brand — do not invent new product colors)

Hex matches existing web SVG helpers (`FoodIcon` / v1 chip icons):

| Role | Hex | Use |
|------|-----|-----|
| Navy | `#153160` | Outlines, eyes, “too much” emphasis |
| Cream | `#F7F2E3` | Default tile background |
| Lime | `#7AB953` | Positive / safe accents |
| Coral | `#DE4E4B` | Negative / “yucky” / “too” accents |
| Amber | `#E48E26` | Warm, tasty, heat |
| Sky | `#5BB0D7` | Cool, soft, smell wisps |
| White | `#FFFEF8` | Highlights |

Tile background may tint slightly (warm cream, cool mint) for polarity, but stay
in-family with these hues.

## Size & readability

- Design for **~40–48px** display (Run chip icon), square **64×64** artboard.
- One clear focal subject; avoid tiny details that vanish at chip size.
- Corner radius ~14px if the asset includes its own rounded tile; otherwise
  transparent subject on cream (UI may supply the frame).
- Prefer **SVG**; PNG/WebP OK only if SVG cannot hold the style.

## Polarity (kid-obvious without reading)

Like / no / so_so variants for the **same sense** must not be identical art with
only the label different.

| Polarity | Visual cues |
|----------|-------------|
| **like** | Smile / open happy face, lime accents, “just right” amount |
| **no** | Frown / X / push-away, coral accents, “too much” or “yucky” exaggeration |
| **so_so** | Neutral / shrug / tilted head, muted accents, neither celebration nor alarm |

Shared base motifs are allowed (e.g. same cracker for crunch) **only** when
polarity cues above are unmistakable at chip size.

## Chip inventory (must all get art)

Copy is locked in `web/src/components/run/whyChips.ts` — do not rename here.

### like

| Chip | Motif direction |
|------|-----------------|
| tasty | Happy taste — smile + yummy food cue |
| crunchy | Clear crunch (cracker / bite with crisp edges), happy |
| soft | Soft pillow / cloud-soft food, happy |
| yummy smell | Nose + pleasant steam/wisps, happy |
| looks good | Eyes / sparkle on appealing food, happy |
| warm | Gentle sun / warm glow (not burning) |
| cold | Cool ice / frost, pleasant |

### no

| Chip | Motif direction |
|------|-----------------|
| yucky taste | Tongue out / disgusted face + coral |
| too crunchy | Same crunch family as like, but “too much” / hurt teeth cue |
| too soft | Mush / droop vs like-soft, unhappy |
| yucky smell | Nose + stinky wisps / coral X |
| looks weird | Confused eyes + odd shape, not horror |
| too hot | Flame / sweat — hotter than like-warm |
| too cold | Shiver / ice — colder / unpleasant vs like-cold |

### so_so

| Chip | Motif direction |
|------|-----------------|
| kind of tasty | Small shrug smile — neither wow nor yuck |
| weird texture | Ambiguous touch (bumpy/odd), neutral face |
| okay smell | Flat / mild wisps, neutral |
| looks okay | Flat look, neutral |
| not sure | Shrug / question posture (no “?” letterforms required if pose reads) |

## Offline generation prompt pack

Reuse this stem for every chip; only swap the **Subject** line.

```text
Children's picture-book sticker illustration for a food-tasting app chip.
Realistic cartoon, soft rounded shapes, clear silhouette, readable at 48px.
Brand colors only: navy #153160, cream #F7F2E3, lime #7AB953, coral #DE4E4B,
amber #E48E26, sky #5BB0D7, white #FFFEF8.
Square 64x64, single focal subject, no text, no watermark, no photorealism,
no emoji style, no purple gradients.
Polarity: {like | no | so_so} using smile/lime vs frown/coral vs neutral/muted.
Subject: {chip motif from tables above}.
Plain cream or softly tinted tile background.
```

After generation: crop to square, simplify if muddy at 48px, commit as static
assets and map in the why-chip icon module. Run must never call an AI API for
these chips.
