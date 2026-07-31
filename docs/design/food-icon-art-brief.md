# Food-icon art brief (locked)

Parent: [hero-food-illustrations](../specs/active/hero-food-illustrations.md)  
Sibling world: [why-chip art brief](./why-chip-art-brief.md)  
Locked: 2026-07-30 · all 10 heroes PNG 2026-07-31 · shared cream ground  
Audience: offline AI concept generation + **human polish** → PNG commit

Use this brief for **every** hero food icon. Do not invent a second style
mid-set. Why-chip art and on-demand catalog AI are **out of scope** here.

## Style anchors (match these files)

All ten locked PNG masters under `web/src/assets/foods/` — **pass several as
references** when generating any new/replacement food so the set stays one world:

| iconKey | File |
|---------|------|
| strawberry | `strawberry.png` |
| banana | `banana.png` |
| ramen | `ramen.png` |
| bagel_cream_cheese | `bagel_cream_cheese.png` |
| yogurt_plain | `yogurt_plain.png` |
| pancakes_choc_chip | `pancakes_choc_chip.png` |
| cheese_pizza | `cheese_pizza.png` |
| soft_pretzel | `soft_pretzel.png` |
| chicken_tenders | `chicken_tenders.png` |
| raspberry | `raspberry.png` |

New concepts should look like they belong on the **same sticker sheet** (outline
weight, shine, shared cream `#F7F2E3` tile, simplification level).

## Goal

A 5–6 year old should recognize **which food** it is at a glance on Plan / Run /
Foods tiles (~40–56px). Text labels stay as backup.

## Style profile (locked)

| Rule | Do | Don't |
|------|----|--------|
| Medium | Picture-book **sticker** | Photo, emoji, flat logo geometry |
| Shape | Organic, slightly uneven | Perfect hearts / crescents / circles |
| Outline | Thick **navy** `#153160` | Missing outline, rainbow strokes |
| Shine | One simple glossy highlight (brand-consistent) | Many speculars; missing shine when peers have it |
| Shadow | **None** under the food | Soft oval / drop shadow on the tile |
| Detail | Sparse, **large** marks that survive 48px | Dense seeds, crumbs, noodle tangles |
| Color | **Food-true first**, brand neighborhood second | Exact-hex paint-by-numbers; purple glow |
| Ground | Flat shared cream `#F7F2E3` for **every** hero | Pink vs yellow mix; one-off tinted outliers |
| Delivery | **PNG master ~256×256** | Geometric SVG rebuild that loses the vibe |

**Food identity:** everyday version of the food (instant ramen ≠ restaurant bowl;
cheese pizza ≠ loaded specialty). Raspberry must read as bumpy drupelets (not a
smooth strawberry). Chicken tenders need breading texture (not corn-on-the-cob
rows) **and** brand shine.

## Palette (brand neighborhood)

| Role | Hex | Use |
|------|-----|-----|
| Navy | `#153160` | Outlines (required) |
| Cream | `#F7F2E3` | **Required shared tile ground** for every hero |
| Lime | `#7AB953` | Leaves / fresh accents |
| Coral | `#DE4E4B` | Berry / sauce family |
| Amber | `#E48E26` | Banana / broth / cheese / crust family |
| Sky | `#5BB0D7` | Cool accents |
| White | `#FFFEF8` | Highlights |
| Crust | `#C56A1E` | Browned bread / pretzel |

## Size & delivery

- Display ~40–56px; author **256×256 PNG** masters (one catch-all; derive
  1x/2x/3x later for iOS).
- Path: `web/src/assets/foods/<iconKey>.png`
- After AI concept: flatten any sneaky ground shadow; force cream ground.

## Concept → lock workflow (per food)

1. Generate **2 concepts** with the prompt pack + several style-anchor PNGs.
2. Parent picks by **A/B order** (don’t narrate pixels that may be wrong); revise
   once if needed.
3. Lock → resize 256, flatten shadow → cream `#F7F2E3`, commit PNG, map in
   `heroFoodIcons`.
4. Update this brief’s hero row if replacing art.
5. Next hero only after lock.

## Human-polish checklist (before commit)

1. Matches style anchors (navy outline, shine, shared cream `#F7F2E3` tile).
2. Reads at ~48px — sparse large details only.
3. No ground shadow.
4. Food-true everyday version; distinct from sibling foods (e.g. raspberry ≠ strawberry).
5. Filename = `iconKey.png`, ~256px, no watermark.
6. Kid can guess the food without the label.

## Hero inventory

| iconKey | Display | Motif direction |
|---------|---------|-----------------|
| strawberry | Strawberries | **Locked PNG** |
| banana | Banana | **Locked PNG** |
| ramen | Instant ramen | **Locked PNG** |
| bagel_cream_cheese | Bagel and cream cheese | **Locked PNG** |
| yogurt_plain | Plain yogurt | **Locked PNG** |
| pancakes_choc_chip | Chocolate chip pancakes | **Locked PNG** |
| cheese_pizza | Cheese pizza | **Locked PNG** |
| soft_pretzel | Soft pretzels | **Locked PNG** |
| chicken_tenders | Chicken tenders | **Locked PNG** (texture + shine) |
| raspberry | Raspberries | **Locked PNG** (centered stem/leaf) |

Non-hero starters and `custom_*` foods are **out of scope**.

## Offline generation prompt pack

```text
Children's picture-book STICKER of a single food for Food Investigators.
MUST match the same sticker sheet as the reference icons: thick navy #153160
outline, one simple glossy highlight/shine, flat cream tile exactly #F7F2E3
(shared by all heroes — not pink, not yellow),
organic (not geometric) silhouette, NOT photoreal, NOT emoji.
NO drop shadow or oval under the food.
Sparse large details only — must stay clear at 48px.
Food-true everyday version first; brand colors are a neighborhood not a lock
(coral/lime/cream/amber/navy family).
Square icon, centered, no text, no watermark, no purple glow.
Subject: {motif from hero inventory — keep toppings/garnish minimal}.
```

Attach several locked `web/src/assets/foods/*.png` as references. After polish:
commit `web/src/assets/foods/<iconKey>.png` and map in `heroFoodIcons`. Run must
never call an AI API for these heroes.
