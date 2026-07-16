-- Planned tasting sessions (household-scoped) with exactly two foods each.
CREATE TABLE tasting_sessions (
    id              UUID PRIMARY KEY,
    household_id    UUID NOT NULL REFERENCES households (id),
    scheduled_on    DATE NOT NULL,
    status          VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tasting_sessions_status_check CHECK (status IN ('planned', 'cancelled'))
);

CREATE INDEX tasting_sessions_household_status_scheduled_idx
    ON tasting_sessions (household_id, status, scheduled_on);

CREATE TABLE tasting_session_foods (
    id              UUID PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES tasting_sessions (id) ON DELETE CASCADE,
    food_id         UUID NOT NULL REFERENCES foods (id),
    familiarity     VARCHAR(32) NOT NULL,
    variant_note    VARCHAR(200),
    position        INTEGER NOT NULL,
    CONSTRAINT tasting_session_foods_familiarity_check CHECK (
        familiarity IN ('likes', 'familiar_but_new', 'truly_new')
    ),
    CONSTRAINT tasting_session_foods_position_check CHECK (position IN (1, 2)),
    CONSTRAINT tasting_session_foods_session_position_unique UNIQUE (session_id, position)
);

CREATE INDEX tasting_session_foods_session_id_idx ON tasting_session_foods (session_id);
CREATE INDEX tasting_session_foods_food_id_idx ON tasting_session_foods (food_id);
