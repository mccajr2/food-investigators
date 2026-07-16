package com.yourorg.quickapp.sessions;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FoodOutcomeRequest(
        @NotNull @Min(1) @Max(2) Integer position,
        Liked liked,
        Texture texture,
        Temperature temperature,
        Smell smell,
        @Size(max = 500) String whyNote,
        @Size(max = 500) String changeNote,
        @NotNull Boolean ateEnough) {}
