package com.yourorg.quickapp.foods;

import java.util.UUID;

/**
 * One household exposure profile (food + variant + familiarity) for suggestion
 * briefs and familiarity resolution.
 */
public record ExposureSnapshot(
        UUID foodId, String foodName, String variantKey, FoodFamiliarity familiarity) {}
