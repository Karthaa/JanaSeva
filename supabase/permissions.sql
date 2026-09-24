-- Grant access to anon role
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON facilities TO anon, authenticated;
GRANT ALL ON tickets TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ranked_facilities(FLOAT, FLOAT, FLOAT) TO anon, authenticated;

-- Ensure RLS is either disabled or allows public read
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on facilities" ON facilities;
CREATE POLICY "Allow public read on facilities" ON facilities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on tickets" ON tickets;
CREATE POLICY "Allow public insert on tickets" ON tickets FOR INSERT WITH CHECK (true);
