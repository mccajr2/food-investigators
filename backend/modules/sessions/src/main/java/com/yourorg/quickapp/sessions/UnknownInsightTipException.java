package com.yourorg.quickapp.sessions;

public class UnknownInsightTipException extends RuntimeException {
    public UnknownInsightTipException(String tipId) {
        super("Unknown tip id: " + tipId);
    }
}
