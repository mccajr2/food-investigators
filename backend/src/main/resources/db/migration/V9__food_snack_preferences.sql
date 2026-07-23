-- Snack vs tasting foods + optional preference fields (snack-taste-log).
ALTER TABLE foods
    ADD COLUMN session_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN liked VARCHAR(16),
    ADD COLUMN texture VARCHAR(16),
    ADD COLUMN taste_note VARCHAR(100);

-- System starters stay session-eligible (default already true).
