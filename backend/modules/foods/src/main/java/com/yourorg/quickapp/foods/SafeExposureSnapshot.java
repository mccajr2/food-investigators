package com.yourorg.quickapp.foods;

import java.util.UUID;

/** One household safe exposure (food + variant) for suggestion adjacency. */
public record SafeExposureSnapshot(UUID foodId, String foodName, String variantKey) {}
