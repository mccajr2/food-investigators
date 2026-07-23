package com.yourorg.quickapp.foods;

/** Invalid snack/tasting preference fields on a food. */
public class InvalidFoodPreferenceException extends RuntimeException {
    public InvalidFoodPreferenceException(String message) {
        super(message);
    }
}
