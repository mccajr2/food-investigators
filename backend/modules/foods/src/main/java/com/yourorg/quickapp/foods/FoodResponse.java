package com.yourorg.quickapp.foods;

import java.time.Instant;
import java.util.UUID;

public record FoodResponse(
        UUID id,
        String name,
        String iconKey,
        UUID householdId,
        boolean system,
        Instant archivedAt) {}
