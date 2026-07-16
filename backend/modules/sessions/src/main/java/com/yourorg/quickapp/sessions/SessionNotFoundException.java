package com.yourorg.quickapp.sessions;

public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException() {
        super("Session not found");
    }
}
