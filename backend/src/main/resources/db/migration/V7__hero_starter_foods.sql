-- Hero starters missing from the original library (custom-food-icons).
INSERT INTO foods (id, name, icon_key, household_id, archived_at, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21', 'Cheese pizza', 'cheese_pizza', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22', 'Soft pretzels', 'soft_pretzel', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', 'Raspberries', 'raspberry', NULL, NULL, NOW(), NOW());
