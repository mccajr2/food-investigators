package com.yourorg.quickapp.foods;

public class SystemFoodImmutableException extends RuntimeException {
    public SystemFoodImmutableException() {
        super("System starter foods cannot be changed");
    }
}
