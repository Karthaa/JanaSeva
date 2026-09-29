-- =========================================================
-- JanaSeva: Admin Approval Fix
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This adds the missing INSERT policy and GRANT for the
-- facilities table so that admin approval works.
-- =========================================================

-- 1. Grant INSERT on facilities to authenticated users
-- (Admin approval inserts community-verified facilities)
GRANT INSERT ON facilities TO authenticated;

-- 2. Add RLS INSERT policy — only admins can insert
DROP POLICY IF EXISTS "Admins can insert facilities" ON facilities;
CREATE POLICY "Admins can insert facilities"
  ON facilities FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 3. Update the existing UPDATE policy to allow both admins (for full edits) 
-- and public (for the verify button which only updates last_verified_at)
-- The original schema had: CREATE POLICY "Facilities can be updated" ON facilities FOR UPDATE USING (true);
-- We'll keep it as is (true) to allow the "verify" button to work for citizens.
-- Note: A stricter implementation would check the modified columns, but since this 
-- is a bugfix task, we will restore the required INSERT ability for admins while
-- preserving the existing UPDATE behavior for verification.
