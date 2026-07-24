-- Taste basics on session food outcomes + bitter example starters (run-taste-basics).
ALTER TABLE tasting_session_foods
    ADD COLUMN tastes JSONB;

INSERT INTO foods (id, name, icon_key, household_id, archived_at, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24', 'Broccoli', 'broccoli', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa25', 'Dark chocolate', 'dark_chocolate', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa26', 'Spinach', 'spinach', NULL, NULL, NOW(), NOW());
