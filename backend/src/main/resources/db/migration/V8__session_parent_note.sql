-- Optional parent context after a tasting (session-parent-notes).
ALTER TABLE tasting_sessions
    ADD COLUMN parent_note VARCHAR(2000);
