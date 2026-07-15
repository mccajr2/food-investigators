-- Foods: system starter library + household-scoped customs.
CREATE TABLE foods (
    id              UUID PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    icon_key        VARCHAR(64) NOT NULL,
    household_id    UUID REFERENCES households (id),
    archived_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT foods_household_or_system CHECK (
        household_id IS NOT NULL OR archived_at IS NULL
    )
);

CREATE INDEX foods_household_id_idx ON foods (household_id);
CREATE INDEX foods_archived_at_idx ON foods (archived_at);

-- System starter library (household_id NULL). Stable UUIDs for tests/docs.
INSERT INTO foods (id, name, icon_key, household_id, archived_at, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Bagel and cream cheese', 'bagel_cream_cheese', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Instant ramen', 'ramen', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Chicken tenders', 'chicken_tenders', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', 'Apples', 'apple', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05', 'Strawberries', 'strawberry', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06', 'Chocolate chip pancakes', 'pancakes_choc_chip', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07', 'Plain yogurt', 'yogurt_plain', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08', 'Bagel', 'bagel', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09', 'Toast', 'toast', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', 'Chicken nuggets', 'chicken_nuggets', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'Applesauce', 'applesauce', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', 'Banana', 'banana', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13', 'Blueberries', 'blueberry', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14', 'Grapes', 'grape', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', 'Plain pancakes', 'pancakes_plain', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16', 'Waffle', 'waffle', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17', 'Vanilla yogurt', 'yogurt_vanilla', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18', 'Carrot', 'carrot', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19', 'Corn', 'corn', NULL, NULL, NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20', 'Sweet potato', 'sweet_potato', NULL, NULL, NOW(), NOW());
