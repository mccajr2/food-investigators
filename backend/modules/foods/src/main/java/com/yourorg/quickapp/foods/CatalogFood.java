package com.yourorg.quickapp.foods;

import java.util.UUID;

/** Food visible to a household and eligible for planning (not archived). */
public record CatalogFood(UUID id, String name, String iconKey) {}
