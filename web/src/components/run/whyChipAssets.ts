import coldUrl from "@/assets/why-chips/cold.png?url"
import crunchyUrl from "@/assets/why-chips/crunchy.png?url"
import looksGoodUrl from "@/assets/why-chips/looks_good.png?url"
import looksWeirdUrl from "@/assets/why-chips/looks_weird.png?url"
import softUrl from "@/assets/why-chips/soft.png?url"
import tastyUrl from "@/assets/why-chips/tasty.png?url"
import tooColdUrl from "@/assets/why-chips/too_cold.png?url"
import tooCrunchyUrl from "@/assets/why-chips/too_crunchy.png?url"
import tooHotUrl from "@/assets/why-chips/too_hot.png?url"
import tooSoftUrl from "@/assets/why-chips/too_soft.png?url"
import warmUrl from "@/assets/why-chips/warm.png?url"
import yuckySmellUrl from "@/assets/why-chips/yucky_smell.png?url"
import yuckyTasteUrl from "@/assets/why-chips/yucky_taste.png?url"
import yummySmellUrl from "@/assets/why-chips/yummy_smell.png?url"

import { WHY_CHIPS_BY_LIKED } from "@/components/run/whyChips"

/** Label → underscore slug for `web/src/assets/why-chips/<slug>.png`. */
export function whyChipSlug(label: string): string {
  return label.replaceAll(" ", "_")
}

/** Unique why-chip labels across like / no / so_so (so_so reuses like∪no strings). */
export function allWhyChipLabels(): string[] {
  return [
    ...new Set([
      ...WHY_CHIPS_BY_LIKED.like,
      ...WHY_CHIPS_BY_LIKED.no,
      ...WHY_CHIPS_BY_LIKED.so_so,
    ]),
  ]
}

/** Vite-resolved URLs for committed why-chip PNG masters (keyed by display label). */
export const WHY_CHIP_ICON_URLS: Record<string, string> = {
  tasty: tastyUrl,
  crunchy: crunchyUrl,
  soft: softUrl,
  "yummy smell": yummySmellUrl,
  "looks good": looksGoodUrl,
  warm: warmUrl,
  cold: coldUrl,
  "yucky taste": yuckyTasteUrl,
  "too crunchy": tooCrunchyUrl,
  "too soft": tooSoftUrl,
  "yucky smell": yuckySmellUrl,
  "looks weird": looksWeirdUrl,
  "too hot": tooHotUrl,
  "too cold": tooColdUrl,
}

export function hasWhyChipIcon(chip: string): boolean {
  return Object.prototype.hasOwnProperty.call(WHY_CHIP_ICON_URLS, chip)
}

export function whyChipIconUrl(chip: string): string | undefined {
  return WHY_CHIP_ICON_URLS[chip]
}
