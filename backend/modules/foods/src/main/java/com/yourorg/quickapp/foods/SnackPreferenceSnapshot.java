package com.yourorg.quickapp.foods;

/** Snack preference fields for Insights aggregates (non-archived snacks). */
public record SnackPreferenceSnapshot(FoodLiked liked, FoodTexture texture) {}
