package com.yourorg.quickapp.sessions;

public class SessionNotEditableException extends RuntimeException {
    public SessionNotEditableException() {
        super("Session cannot be edited");
    }
}
