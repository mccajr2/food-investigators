package com.yourorg.quickapp.foods;

import java.util.UUID;

/** One parent-nominated stretch destination for suggestion briefs. */
public record StretchTargetSnapshot(UUID foodId, String foodName, String variantKey) {}
