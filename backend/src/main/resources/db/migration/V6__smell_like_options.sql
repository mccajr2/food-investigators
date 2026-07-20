-- Align smell answers with liked: like / so_so / no.
-- Drop the old check first so remapped values are allowed, then rewrite data.
ALTER TABLE tasting_session_foods
    DROP CONSTRAINT tasting_session_foods_smell_check;

UPDATE tasting_session_foods
SET smell = 'like'
WHERE smell = 'mild';

UPDATE tasting_session_foods
SET smell = 'no'
WHERE smell = 'strong';

ALTER TABLE tasting_session_foods
    ADD CONSTRAINT tasting_session_foods_smell_check
        CHECK (smell IS NULL OR smell IN ('like', 'so_so', 'no'));
