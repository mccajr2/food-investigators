-- Household exposure profiles: familiarity per food + presentation (variant).
CREATE TABLE household_food_exposures (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households (id),
    food_id UUID NOT NULL REFERENCES foods (id),
    variant_key VARCHAR(200) NOT NULL,
    familiarity VARCHAR(32) NOT NULL,
    source VARCHAR(16) NOT NULL,
    attempt_count INTEGER,
    last_tried_on DATE,
    last_liked VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT household_food_exposures_familiarity_check
        CHECK (familiarity IN ('safe', 'familiar_but_new', 'truly_new', 'retrying')),
    CONSTRAINT household_food_exposures_source_check
        CHECK (source IN ('manual', 'signup', 'outcome')),
    CONSTRAINT household_food_exposures_unique
        UNIQUE (household_id, food_id, variant_key)
);

CREATE INDEX household_food_exposures_household_idx
    ON household_food_exposures (household_id);

CREATE INDEX household_food_exposures_household_food_idx
    ON household_food_exposures (household_id, food_id);

COMMENT ON TABLE household_food_exposures IS
    'Per-household familiarity for a food presentation (brand/prep). Empty variant_key = unspecified.';
COMMENT ON COLUMN household_food_exposures.variant_key IS
    'Normalized (trim + case-fold) brand/prep note; empty string when none.';
