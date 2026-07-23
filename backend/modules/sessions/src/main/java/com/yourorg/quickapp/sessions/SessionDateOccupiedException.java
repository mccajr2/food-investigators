package com.yourorg.quickapp.sessions;

/** Another planned or completed session already occupies this calendar day. */
public class SessionDateOccupiedException extends RuntimeException {
    public SessionDateOccupiedException() {
        super("A session already exists on that date");
    }
}
