-- Shared food illustration metadata (PNG bytes live in object storage, not Postgres).
-- Global by canonical_key — no household ownership; families reuse the same key.
CREATE TABLE food_illustrations (
    canonical_key   VARCHAR(64) PRIMARY KEY,
    object_key      VARCHAR(512) NOT NULL,
    content_type    VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
