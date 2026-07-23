-- Remembered Insights tip dismissals per household (pace-insights).
CREATE TABLE insight_tip_dismissals (
    household_id UUID NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    tip_id VARCHAR(64) NOT NULL,
    dismissed_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (household_id, tip_id)
);

CREATE INDEX idx_insight_tip_dismissals_household
    ON insight_tip_dismissals (household_id);
