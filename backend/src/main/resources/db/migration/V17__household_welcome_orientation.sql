-- Household-scoped dismiss for the one-shot welcome orientation panel.
ALTER TABLE households
    ADD COLUMN welcome_orientation_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN households.welcome_orientation_dismissed_at IS
    'When set, the household has dismissed the welcome orientation; null means show once.';
