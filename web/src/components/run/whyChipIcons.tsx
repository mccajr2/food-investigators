/**
 * Why-chip illustrations — locked art direction:
 * docs/design/why-chip-art-brief.md
 *
 * Static PNG masters (offline AI-assisted / hand-polished). No runtime AI.
 */
import { whyChipIconUrl } from "@/components/run/whyChipAssets"
import { cn } from "@/lib/utils"

export {
  allWhyChipLabels,
  hasWhyChipIcon,
  whyChipIconUrl,
  whyChipSlug,
  WHY_CHIP_ICON_URLS,
} from "@/components/run/whyChipAssets"

export function WhyChipIcon({
  chip,
  className,
}: {
  chip: string
  className?: string
}) {
  const src = whyChipIconUrl(chip)
  if (!src) {
    return (
      <span
        aria-hidden
        data-why-chip={chip}
        data-why-chip-src="missing"
        className={cn(
          "inline-block size-10 shrink-0 rounded-2xl bg-[#F7F2E3] md:size-12",
          className,
        )}
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      data-why-chip={chip}
      data-why-chip-src="static"
      className={cn(
        "size-10 shrink-0 rounded-2xl object-contain md:size-12",
        className,
      )}
    />
  )
}
