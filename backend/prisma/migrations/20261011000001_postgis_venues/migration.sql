-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Main venues table (Apache 2.0 / CDLA-Permissive-2.0 data: Overture Maps, FSQ OS, AllThePlaces, IMLS, NPS)
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  fsq_id TEXT,
  overture_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- DateMeUp category slug (restaurants-dining, after-dark, etc.)
  fsq_category TEXT,      -- original FSQ / Overture taxonomy category
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT,
  website TEXT,
  hours JSONB,
  price_level INTEGER,    -- 1-4
  rating DOUBLE PRECISION,
  source TEXT NOT NULL,   -- 'overture', 'fsq_os', 'alltheplaces', 'nps', 'imls'
  raw_categories JSONB,
  date_closed DATE,
  confidence DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for radius queries
CREATE INDEX IF NOT EXISTS venues_location_gist ON venues USING GIST(location);
-- Text search index
CREATE INDEX IF NOT EXISTS venues_name_trgm ON venues USING GIN(name gin_trgm_ops);
-- Category + country filter index
CREATE INDEX IF NOT EXISTS venues_category_country ON venues(category, country);
-- FSQ ID dedup index
CREATE INDEX IF NOT EXISTS venues_fsq_id ON venues(fsq_id) WHERE fsq_id IS NOT NULL;
-- Overture ID dedup index
CREATE INDEX IF NOT EXISTS venues_overture_id ON venues(overture_id) WHERE overture_id IS NOT NULL;

-- Separate OSM table (ODbL isolation - NEVER mix with venues table)
-- OSM data is ODbL (share-alike) — keep strictly isolated.
CREATE TABLE IF NOT EXISTS venues_osm (
  id TEXT PRIMARY KEY,
  osm_id BIGINT,
  osm_type TEXT,          -- node/way/relation
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- DateMeUp category slug
  osm_tags JSONB,
  address TEXT,
  city TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS venues_osm_location_gist ON venues_osm USING GIST(location);
CREATE INDEX IF NOT EXISTS venues_osm_category ON venues_osm(category);

-- Refresh tracking
CREATE TABLE IF NOT EXISTS venue_refresh_log (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  rows_upserted INTEGER,
  rows_deleted INTEGER,
  error TEXT
);
