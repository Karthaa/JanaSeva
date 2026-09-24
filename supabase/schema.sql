-- =========================================================
-- JalSaaf: Schema + Truth-Decay Ranking Engine
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('toilet', 'drinking_water')),
  status TEXT NOT NULL DEFAULT 'usable' CHECK (status IN ('clean', 'usable', 'broken', 'locked', 'no_water')),
  accessibility TEXT NOT NULL DEFAULT 'none' CHECK (accessibility IN ('wheelchair', 'limited', 'none')),
  location GEOMETRY(Point, 4326) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  managed_by TEXT NOT NULL DEFAULT 'Unknown',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_reports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities (type);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities (status);

-- 3. Tickets table (anonymous — uses device_id UUID, NOT user identity)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  device_id UUID NOT NULL, -- anonymous client-generated UUID
  reported_status TEXT NOT NULL CHECK (reported_status IN ('clean', 'usable', 'broken', 'locked', 'no_water')),
  comment TEXT DEFAULT '',
  ticket_number TEXT NOT NULL,
  routed_to TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_facility ON tickets (facility_id);
CREATE INDEX IF NOT EXISTS idx_tickets_device ON tickets (device_id);

-- 4. Auto-update trigger for facilities.updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON facilities;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- 5. Auto-increment total_reports on ticket insert
CREATE OR REPLACE FUNCTION increment_facility_reports()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facilities
  SET total_reports = total_reports + 1,
      status = NEW.reported_status,
      last_verified_at = NEW.created_at
  WHERE id = NEW.facility_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_insert ON tickets;
CREATE TRIGGER on_ticket_insert
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION increment_facility_reports();

-- =========================================================
-- 6. THE TRUTH-DECAY RANKING ENGINE (PostGIS RPC)
--
-- Confidence Score = base_status_score * accessibility_mul * exp(-λ * hours_since_verified)
-- λ = 0.005 → ~50% decay after ~6 days
--
-- Returns facilities within radius_m, ranked by confidence_score DESC, distance ASC
-- =========================================================

CREATE OR REPLACE FUNCTION get_ranked_facilities(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  status TEXT,
  accessibility TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  managed_by TEXT,
  last_verified_at TIMESTAMPTZ,
  confidence_score INTEGER,
  distance_m DOUBLE PRECISION,
  total_reports INTEGER,
  geojson TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.type,
    f.status,
    f.accessibility,
    ST_Y(f.location) AS latitude,
    ST_X(f.location) AS longitude,
    f.address,
    f.managed_by,
    f.last_verified_at,
    -- THE TRUTH-DECAY CONFIDENCE FORMULA
    CAST(
      ROUND(
        -- Base status score
        (CASE f.status
          WHEN 'clean' THEN 95
          WHEN 'usable' THEN 70
          WHEN 'broken' THEN 15
          WHEN 'locked' THEN 10
          WHEN 'no_water' THEN 20
          ELSE 50
        END)
        -- × Accessibility multiplier
        * (CASE f.accessibility
          WHEN 'wheelchair' THEN 1.0
          WHEN 'limited' THEN 0.85
          WHEN 'none' THEN 0.7
          ELSE 0.7
        END)
        -- × Exponential time decay: exp(-0.005 × hours_since_verified)
        * EXP(-0.005 * EXTRACT(EPOCH FROM (now() - f.last_verified_at)) / 3600.0)
      )
    AS INTEGER) AS confidence_score,
    -- Distance in meters using ST_Distance on geography
    ST_Distance(
      f.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_m,
    f.total_reports,
    ST_AsGeoJSON(f.location) AS geojson
  FROM facilities f
  WHERE ST_DWithin(
    f.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_m
  )
  ORDER BY confidence_score DESC, distance_m ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Row Level Security
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Public read access for facilities
CREATE POLICY "Facilities are publicly readable"
  ON facilities FOR SELECT
  USING (true);

-- Public insert for tickets (anonymous reports)
CREATE POLICY "Anyone can submit tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Public read for tickets (to show report counts)
CREATE POLICY "Tickets are publicly readable"
  ON tickets FOR SELECT
  USING (true);

-- Public update for facilities (status updates from reports)
CREATE POLICY "Facilities can be updated"
  ON facilities FOR UPDATE
  USING (true);
