package com.yourorg.quickapp.foods;

import java.util.Optional;
import java.util.UUID;

/** Cross-module lookup of foods for a household (system or household-owned). */
public interface FoodCatalog {

    /** System or this household's food, including archived (for reading past plans). */
    Optional<CatalogFood> findVisible(UUID householdId, UUID foodId);

    /** Visible and not archived — eligible when creating or updating a plan. */
    Optional<CatalogFood> findSelectable(UUID householdId, UUID foodId);
}
