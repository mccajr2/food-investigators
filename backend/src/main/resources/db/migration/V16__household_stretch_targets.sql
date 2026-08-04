-- Parent-nominated stretch destinations (food + presentation) for Suggest pacing.
CREATE TABLE household_stretch_targets (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households (id),
    food_id UUID NOT NULL REFERENCES foods (id),
    variant_key VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT household_stretch_targets_unique
        UNIQUE (household_id, food_id, variant_key)
);

CREATE INDEX household_stretch_targets_household_idx
    ON household_stretch_targets (household_id);

COMMENT ON TABLE household_stretch_targets IS
    'Parent-nominated stretch destinations (food + variant). Empty variant_key = unspecified.';
COMMENT ON COLUMN household_stretch_targets.variant_key IS
    'Normalized (trim + case-fold) brand/prep note; empty string when none.';
