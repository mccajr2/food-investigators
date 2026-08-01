-- Optional single-child display first name for beta personalization.
-- Multi-child later may move this to a children table (see child-display-name spec).
ALTER TABLE households
    ADD COLUMN child_display_name VARCHAR(40);

COMMENT ON COLUMN households.child_display_name IS
    'Optional display first name for the household''s current/primary child (beta). May migrate to a children table for multi-child-profiles.';
