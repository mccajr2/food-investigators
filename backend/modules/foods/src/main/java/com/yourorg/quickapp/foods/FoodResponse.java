package com.yourorg.quickapp.foods;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FoodResponse(
        UUID id,
        String name,
        String iconKey,
        String iconUrl,
        UUID householdId,
        boolean system,
        boolean sessionEligible,
        FoodLiked liked,
        FoodTexture texture,
        String tasteNote,
        Instant archivedAt,
        List<FoodExposureResponse> exposures) {}
