package com.yourorg.quickapp.sessions;

public class InvalidSessionOutcomeException extends RuntimeException {
    public InvalidSessionOutcomeException(String message) {
        super(message);
    }
}
