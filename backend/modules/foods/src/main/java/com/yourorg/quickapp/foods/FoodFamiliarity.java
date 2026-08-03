package com.yourorg.quickapp.foods;

/**
 * Household exposure ladder — mirrors OpenAPI {@code Familiarity} / session slot
 * values without depending on the sessions module.
 */
public enum FoodFamiliarity {
    safe,
    familiar_but_new,
    truly_new,
    retrying
}
