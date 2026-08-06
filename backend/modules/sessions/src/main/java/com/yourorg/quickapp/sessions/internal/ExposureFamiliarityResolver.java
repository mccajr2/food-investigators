package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.ExposureSnapshot;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.sessions.Familiarity;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Maps a suggested catalog food (+ optional presentation) onto household exposure
 * familiarity. LLM/heuristic familiarity is only a fallback when no exposure applies.
 */
final class ExposureFamiliarityResolver {

    record Resolved(Familiarity familiarity, String variantNote) {}

    private ExposureFamiliarityResolver() {}

    static Resolved resolve(
            UUID foodId,
            String requestedVariantNote,
            List<ExposureSnapshot> exposures,
            Familiarity fallback) {
        Familiarity safeFallback = fallback != null ? fallback : Familiarity.truly_new;
        if (foodId == null) {
            return new Resolved(safeFallback, blankToNull(normalize(requestedVariantNote)));
        }
        String key = normalize(requestedVariantNote);
        List<ExposureSnapshot> forFood = new ArrayList<>();
        if (exposures != null) {
            for (ExposureSnapshot row : exposures) {
                if (foodId.equals(row.foodId())) {
                    forFood.add(row);
                }
            }
        }
        if (forFood.isEmpty()) {
            return new Resolved(safeFallback, blankToNull(key));
        }

        for (ExposureSnapshot row : forFood) {
            if (key.equals(normalize(row.variantKey()))) {
                return from(row);
            }
        }

        if (key.isEmpty()) {
            for (ExposureSnapshot row : forFood) {
                if (normalize(row.variantKey()).isEmpty()) {
                    return from(row);
                }
            }
            for (ExposureSnapshot row : forFood) {
                if (row.familiarity() == FoodFamiliarity.safe) {
                    return from(row);
                }
            }
            if (forFood.size() == 1) {
                return from(forFood.getFirst());
            }
            return new Resolved(safeFallback, null);
        }

        boolean anySafe =
                forFood.stream().anyMatch(row -> row.familiarity() == FoodFamiliarity.safe);
        if (anySafe) {
            return new Resolved(Familiarity.familiar_but_new, blankToNull(key));
        }
        return new Resolved(
                safeFallback == Familiarity.safe ? Familiarity.truly_new : safeFallback,
                blankToNull(key));
    }

    private static Resolved from(ExposureSnapshot row) {
        return new Resolved(toSession(row.familiarity()), blankToNull(row.variantKey()));
    }

    private static Familiarity toSession(FoodFamiliarity familiarity) {
        return Familiarity.valueOf(familiarity.name());
    }

    static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
