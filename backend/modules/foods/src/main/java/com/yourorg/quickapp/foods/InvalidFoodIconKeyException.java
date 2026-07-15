package com.yourorg.quickapp.foods;

public class InvalidFoodIconKeyException extends RuntimeException {
    public InvalidFoodIconKeyException(String iconKey) {
        super("Invalid food icon key: " + iconKey);
    }
}
