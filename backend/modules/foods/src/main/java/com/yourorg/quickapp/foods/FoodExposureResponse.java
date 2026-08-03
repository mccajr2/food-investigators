package com.yourorg.quickapp.foods;

import java.time.LocalDate;
import java.util.UUID;

public record FoodExposureResponse(
        UUID foodId,
        String variantKey,
        FoodFamiliarity familiarity,
        ExposureSource source,
        Integer attemptCount,
        LocalDate lastTriedOn,
        String lastLiked) {}
