package com.yourorg.quickapp.foods;

import java.time.Instant;
import java.util.UUID;

public record StretchTargetResponse(
        UUID id, UUID foodId, String foodName, String variantKey, Instant createdAt) {}
