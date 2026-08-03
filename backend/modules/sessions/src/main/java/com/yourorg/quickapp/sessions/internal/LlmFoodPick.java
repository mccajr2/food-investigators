package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import java.util.UUID;

/**
 * One LLM food pick. Catalog picks set {@code foodId}; invent picks leave {@code foodId}
 * null and set {@code proposedName} (+ optional {@code proposedVariantNote}).
 */
record LlmFoodPick(
        UUID foodId, Familiarity familiarity, String proposedName, String proposedVariantNote) {

    LlmFoodPick(UUID foodId, Familiarity familiarity) {
        this(foodId, familiarity, null, null);
    }

    static LlmFoodPick invent(
            String proposedName, String proposedVariantNote, Familiarity familiarity) {
        return new LlmFoodPick(null, familiarity, proposedName, proposedVariantNote);
    }

    boolean isInvent() {
        return foodId == null;
    }
}
