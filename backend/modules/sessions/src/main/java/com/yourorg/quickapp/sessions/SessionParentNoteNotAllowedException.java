package com.yourorg.quickapp.sessions;

/** Parent notes may only be saved on completed sessions. */
public class SessionParentNoteNotAllowedException extends RuntimeException {
    public SessionParentNoteNotAllowedException() {
        super("Parent notes can only be saved on completed sessions");
    }
}
