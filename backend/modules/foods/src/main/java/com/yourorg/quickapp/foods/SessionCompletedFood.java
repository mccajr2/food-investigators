package com.yourorg.quickapp.foods;

import java.util.UUID;

/** One completed session food slot for {@link SessionCompletedEvent}. */
public record SessionCompletedFood(
        UUID foodId, String variantNote, String liked, boolean ateEnough) {}
