-- Run outcomes + completed status for tasting sessions.
ALTER TABLE tasting_sessions
    DROP CONSTRAINT tasting_sessions_status_check;

ALTER TABLE tasting_sessions
    ADD CONSTRAINT tasting_sessions_status_check
        CHECK (status IN ('planned', 'cancelled', 'completed'));

ALTER TABLE tasting_session_foods
    ADD COLUMN liked VARCHAR(16),
    ADD COLUMN texture VARCHAR(16),
    ADD COLUMN temperature VARCHAR(16),
    ADD COLUMN smell VARCHAR(16),
    ADD COLUMN why_note VARCHAR(500),
    ADD COLUMN change_note VARCHAR(500),
    ADD COLUMN ate_enough BOOLEAN;

ALTER TABLE tasting_session_foods
    ADD CONSTRAINT tasting_session_foods_liked_check
        CHECK (liked IS NULL OR liked IN ('like', 'so_so', 'no')),
    ADD CONSTRAINT tasting_session_foods_texture_check
        CHECK (texture IS NULL OR texture IN ('soft', 'crunchy', 'chewy', 'wet')),
    ADD CONSTRAINT tasting_session_foods_temperature_check
        CHECK (temperature IS NULL OR temperature IN ('cold', 'warm', 'hot')),
    ADD CONSTRAINT tasting_session_foods_smell_check
        CHECK (smell IS NULL OR smell IN ('mild', 'strong'));
