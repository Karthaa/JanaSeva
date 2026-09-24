-- =========================================================
-- JalSaaf: Live Operations Upgrade
-- Run this in Supabase SQL Editor to expand reporting and enable realtime
-- =========================================================

-- 1. Modify tickets table to support detailed UI
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_reported_status_check;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS issue_type TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS photo_path TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_affected BOOLEAN,
  ADD COLUMN IF NOT EXISTS water_available BOOLEAN,
  ADD COLUMN IF NOT EXISTS cleanliness TEXT,
  ADD COLUMN IF NOT EXISTS other_issue TEXT;

-- 2. Enable Realtime on facilities
BEGIN;
  -- Ensure publication exists
  DO $$ 
  BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          CREATE PUBLICATION supabase_realtime;
      END IF;
  END $$;
  
  -- Add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE facilities;
  ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Ignore if already added
END;

-- 3. Create Storage bucket for report images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'report-images', 
  'report-images', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- First, ensure storage schema is accessible if needed, but Supabase handles this by default.
-- Allow anonymous/public upload to the bucket
DO $$ 
BEGIN 
  CREATE POLICY "Public anonymous upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'report-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow public read of images
DO $$ 
BEGIN 
  CREATE POLICY "Public read report images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'report-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
