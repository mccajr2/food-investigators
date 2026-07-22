import { cn } from "@/lib/utils"

/** Full logo (characters + tagline) — Auth, reward celebration beats. */
export const BRAND_LOGO_SRC = "/FoodInvestigatorsLogo.png"

/** Compact logo (no people / tagline) — shell header, run/play chrome. */
export const BRAND_LOGO_SMALL_SRC = "/FoodInvestigatorsLogoSmall.png"

export const BRAND_NAME = "Food Investigators"

export type BrandLogoVariant = "full" | "compact"

type BrandLogoProps = {
  variant?: BrandLogoVariant
  className?: string
}

const variantClass: Record<BrandLogoVariant, string> = {
  full: "h-auto w-full max-w-md object-contain object-center",
  // Readable chrome size (~3× original tiny mark; bumped again for clarity).
  compact:
    "h-[7.5rem] w-auto max-w-[33rem] object-contain object-center sm:h-[8.25rem] sm:max-w-[39rem]",
}

const variantSrc: Record<BrandLogoVariant, string> = {
  full: BRAND_LOGO_SRC,
  compact: BRAND_LOGO_SMALL_SRC,
}

/**
 * Official brand mark. Use `full` on Auth + reward celebrate beats;
 * `compact` (small asset) wherever the mark is scaled down.
 */
export function BrandLogo({
  variant = "full",
  className,
}: BrandLogoProps) {
  return (
    <img
      src={variantSrc[variant]}
      alt={BRAND_NAME}
      data-brand-logo={variant}
      className={cn(variantClass[variant], className)}
      decoding="async"
    />
  )
}
