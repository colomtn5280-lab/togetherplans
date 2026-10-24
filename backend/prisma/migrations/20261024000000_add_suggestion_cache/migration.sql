-- E1: Postgres-backed suggestion cache
-- Replaces in-memory MemoryCache; survives scale-to-zero, shared across instances.
-- Migrate to Redis at ~5k DAU when VPC connector is justified.

CREATE TABLE IF NOT EXISTS "SuggestionCache" (
  "key"       TEXT        NOT NULL,
  "value"     TEXT        NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "SuggestionCache_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "SuggestionCache_expiresAt_idx"
  ON "SuggestionCache" ("expiresAt");
