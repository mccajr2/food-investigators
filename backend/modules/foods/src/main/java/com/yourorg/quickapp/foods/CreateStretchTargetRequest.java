package com.yourorg.quickapp.foods;

import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Nominate a stretch destination. Provide either {@code foodId} (existing tasting
 * food) or {@code name} (match system/household or invent). Not both empty.
 */
public record CreateStretchTargetRequest(
        UUID foodId, @Size(max = 200) String name, @Size(max = 200) String variantKey) {}
