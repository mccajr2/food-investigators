package com.yourorg.quickapp.sessions;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SessionFoodRequest(
        @NotNull UUID foodId,
        @NotNull Familiarity familiarity,
        @Size(max = 200) String variantNote) {}
