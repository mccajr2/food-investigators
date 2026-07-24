-- Rename familiarity likes → safe; add retrying (familiarity-retry).
-- Drop CHECK first: updating to 'safe' while the old constraint still allows
-- only 'likes' would fail on existing rows.
ALTER TABLE tasting_session_foods
    DROP CONSTRAINT tasting_session_foods_familiarity_check;

UPDATE tasting_session_foods
SET familiarity = 'safe'
WHERE familiarity = 'likes';

ALTER TABLE tasting_session_foods
    ADD CONSTRAINT tasting_session_foods_familiarity_check CHECK (
        familiarity IN ('safe', 'familiar_but_new', 'truly_new', 'retrying')
    );
