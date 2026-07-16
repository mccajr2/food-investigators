package com.yourorg.quickapp.sessions;

public class InvalidSessionFoodException extends RuntimeException {
    public InvalidSessionFoodException(String message) {
        super(message);
    }
}
