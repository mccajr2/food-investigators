package com.yourorg.quickapp.foods;

public class FoodNotFoundException extends RuntimeException {
    public FoodNotFoundException() {
        super("Food not found");
    }
}
