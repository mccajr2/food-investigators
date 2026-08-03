package com.yourorg.quickapp.foods;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpsertFoodExposureRequest(
        @Size(max = 200) String variantKey, @NotNull FoodFamiliarity familiarity) {}
