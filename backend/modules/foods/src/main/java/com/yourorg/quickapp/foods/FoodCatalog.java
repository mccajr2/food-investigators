package com.yourorg.quickapp.foods;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Cross-module lookup of foods for a household (system or household-owned). */
public interface FoodCatalog {

    /** System or this household's food, including archived (for reading past plans). */
    Optional<CatalogFood> findVisible(UUID householdId, UUID foodId);

    /** Visible and not archived and session-eligible — for creating or updating a plan. */
    Optional<CatalogFood> findSelectable(UUID householdId, UUID foodId);

    /**
     * Active (non-archived) snack foods for the household — {@code sessionEligible=false}.
     * Liked/texture may be null when unset.
     */
    List<SnackPreferenceSnapshot> listActiveSnackPreferences(UUID householdId);
}
