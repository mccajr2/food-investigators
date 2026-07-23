package com.yourorg.quickapp.foods;

import jakarta.validation.constraints.Size;

public record UpdateFoodRequest(
        @Size(max = 200) String name,
        @Size(max = 64) String iconKey,
        Boolean sessionEligible,
        FoodLiked liked,
        FoodTexture texture,
        @Size(max = 100) String tasteNote) {}
