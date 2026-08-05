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
     * Active (non-archived) session-eligible foods visible to the household (system starters +
     * household tasting foods).
     */
    List<CatalogFood> listSelectable(UUID householdId);

    /**
     * Active (non-archived) snack foods for the household — {@code sessionEligible=false}.
     * Liked/texture may be null when unset.
     */
    List<SnackPreferenceSnapshot> listActiveSnackPreferences(UUID householdId);

    /**
     * Household exposure profiles with {@code familiarity=safe}, bounded for suggestion
     * briefs. Includes food display name and normalized variant key (blank = unspecified).
     */
    List<SafeExposureSnapshot> listSafeExposures(UUID householdId);

    /**
     * Active parent-nominated stretch destinations for suggestion briefs (food +
     * variant), sorted by food name then variant key.
     */
    List<StretchTargetSnapshot> listStretchTargets(UUID householdId);
}
