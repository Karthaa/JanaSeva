-- =========================================================
-- JanaSeva: Community Facility Submissions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Admin users table (for role-based access)
-- Admins must sign in via Supabase Auth. Their user ID is stored here.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,  -- references auth.users(id)
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users (user_id);

-- 2. Facility Submissions table
CREATE TABLE IF NOT EXISTS facility_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Facility details
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('toilet', 'drinking_water')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  landmark TEXT,
  description TEXT,
  accessibility TEXT DEFAULT 'unknown' CHECK (accessibility IN ('wheelchair', 'limited', 'unknown')),

  -- Submission metadata
  submitted_by UUID,  -- auth.uid() if logged in, NULL for anonymous
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Review workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID,  -- admin user_id from auth.users
  reviewed_at TIMESTAMPTZ,
  approved_facility_id UUID,  -- references facilities(id) if approved

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'community'
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON facility_submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON facility_submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON facility_submissions (type);
CREATE INDEX IF NOT EXISTS idx_submissions_coords ON facility_submissions (latitude, longitude);

-- 3. Add 'source' column to facilities table if not exists
-- This allows us to distinguish community-added facilities from OSM/network data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'source'
  ) THEN
    ALTER TABLE facilities ADD COLUMN source TEXT DEFAULT 'network';
  END IF;
END $$;

-- 4. Add 'latitude' and 'longitude' convenience columns to facilities if not exists
-- The existing schema uses PostGIS 'location' geometry, but the app also uses lat/lng directly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE facilities ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE facilities ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- 5. Enable RLS on facility_submissions
ALTER TABLE facility_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 6. RLS POLICIES — facility_submissions
-- =========================================================

-- CITIZEN: Anyone can INSERT a new submission (anonymous supported)
DROP POLICY IF EXISTS "Anyone can submit facility suggestions" ON facility_submissions;
CREATE POLICY "Anyone can submit facility suggestions"
  ON facility_submissions FOR INSERT
  WITH CHECK (
    -- Enforce: new submissions must be 'pending', source must be 'community'
    status = 'pending'
    AND source = 'community'
    AND approved_facility_id IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND admin_note IS NULL
  );

-- CITIZEN: Can read their own submissions (if logged in)
DROP POLICY IF EXISTS "Users can read own submissions" ON facility_submissions;
CREATE POLICY "Users can read own submissions"
  ON facility_submissions FOR SELECT
  USING (
    -- If user is authenticated, they can see their own submissions
    (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
    -- Admins can see all
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ADMIN: Can update submissions (approve/reject)
DROP POLICY IF EXISTS "Admins can update submissions" ON facility_submissions;
CREATE POLICY "Admins can update submissions"
  ON facility_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =========================================================
-- 7. RLS POLICIES — admin_users
-- =========================================================

-- Only admins can read the admin_users table
DROP POLICY IF EXISTS "Admins can read admin list" ON admin_users;
CREATE POLICY "Admins can read admin list"
  ON admin_users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE via frontend — managed via SQL/dashboard only

-- =========================================================
-- 8. GRANTS
-- =========================================================

GRANT SELECT, INSERT ON facility_submissions TO anon, authenticated;
GRANT UPDATE ON facility_submissions TO authenticated;
GRANT SELECT ON admin_users TO authenticated;

-- =========================================================
-- 9. Enable Realtime for facility_submissions
-- =========================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE facility_submissions;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Already added
END $$;

-- =========================================================
-- 10. Helper function: Check for nearby duplicate facilities
-- Returns facilities within a given radius (meters) of a point
-- =========================================================
CREATE OR REPLACE FUNCTION check_nearby_facilities(
  check_lat DOUBLE PRECISION,
  check_lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  distance_m DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.type,
    ST_Distance(
      f.location::geography,
      ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography
    ) AS distance_m
  FROM facilities f
  WHERE ST_DWithin(
    f.location::geography,
    ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography,
    radius_m
  )
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION check_nearby_facilities(FLOAT, FLOAT, FLOAT) TO anon, authenticated;
