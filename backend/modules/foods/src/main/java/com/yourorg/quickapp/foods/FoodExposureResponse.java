package com.yourorg.quickapp.foods;

import java.util.UUID;

public record FoodExposureResponse(
        UUID foodId, String variantKey, FoodFamiliarity familiarity, ExposureSource source) {}
