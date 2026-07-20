package com.yourorg.quickapp.sessions;

import java.util.UUID;

public record SessionFoodResponse(
        UUID foodId,
        String name,
        String iconKey,
        Familiarity familiarity,
        String variantNote,
        int position,
        Liked liked,
        Texture texture,
        Temperature temperature,
        Smell smell,
        String whyNote,
        String changeNote,
        Boolean ateEnough) {}
