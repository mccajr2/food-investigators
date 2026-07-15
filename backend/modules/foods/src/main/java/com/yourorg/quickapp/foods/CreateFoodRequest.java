package com.yourorg.quickapp.foods;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFoodRequest(
        @NotBlank @Size(max = 200) String name, @NotBlank @Size(max = 64) String iconKey) {}
