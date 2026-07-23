package com.yourorg.quickapp.sessions;

/** Scheduled date is before today. */
public class InvalidSessionScheduleException extends RuntimeException {
    public InvalidSessionScheduleException(String message) {
        super(message);
    }
}
