package com.yourorg.quickapp.sessions;

import java.util.UUID;

/**
 * One food in a suggestion draft. Catalog picks have a non-null {@code foodId}. Invent
 * proposals use {@code foodId == null} with a non-blank {@code proposedName} (optional
 * {@code proposedVariantNote}); they materialize on Approve only.
 */
public record SuggestedSessionFood(
        UUID foodId,
        String name,
        String iconKey,
        String iconUrl,
        Familiarity familiarity,
        String proposedName,
        String proposedVariantNote,
        String variantNote) {}
