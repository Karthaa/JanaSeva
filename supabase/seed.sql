-- =========================================================
-- JalSaaf: Real-World Kochi Seed Data
-- Run this in Supabase SQL Editor
-- =========================================================

TRUNCATE TABLE facilities CASCADE;

INSERT INTO facilities (name, type, status, accessibility, location, address, managed_by, last_verified_at, total_reports)
VALUES
  -- TOILETS
  ('Public Toilet - Panangad', 'toilet', 'clean', 'wheelchair', ST_SetSRID(ST_MakePoint(76.2864323, 9.8857718), 4326), 'Panangad, Kochi', 'Kochi Corporation', now() - interval '2 days', 12),
  ('Public Toilet - Thevara', 'toilet', 'usable', 'limited', ST_SetSRID(ST_MakePoint(76.256472, 9.9232942), 4326), 'Thevara, Kochi', 'Kochi Corporation', now() - interval '14 days', 8),
  ('Public Toilet - Ravipuram', 'toilet', 'clean', 'none', ST_SetSRID(ST_MakePoint(76.244461, 9.9731657), 4326), 'Ravipuram, Kochi', 'Kochi Corporation', now() - interval '5 days', 24),
  ('Public Toilet - Nettoor', 'toilet', 'broken', 'wheelchair', ST_SetSRID(ST_MakePoint(76.2842326, 9.8975397), 4326), 'Nettoor, Kochi', 'Kochi Corporation', now() - interval '45 days', 3),
  ('Public Toilet - Fort Kochi', 'toilet', 'clean', 'limited', ST_SetSRID(ST_MakePoint(76.2398291, 9.9655414), 4326), 'Fort Kochi Beach', 'Kochi Corporation', now() - interval '1 day', 56),
  ('Public Toilet - Edappally', 'toilet', 'usable', 'none', ST_SetSRID(ST_MakePoint(76.2102067, 10.0730167), 4326), 'Edappally Toll', 'Kochi Corporation', now() - interval '20 days', 15),
  ('Public Toilet - Aluva', 'toilet', 'clean', 'wheelchair', ST_SetSRID(ST_MakePoint(76.1876079, 10.1092341), 4326), 'Aluva Metro', 'KMRL', now() - interval '3 days', 41),

  -- DRINKING WATER
  ('Water Kiosk - Palarivattom', 'drinking_water', 'clean', 'wheelchair', ST_SetSRID(ST_MakePoint(76.2211168, 10.0323146), 4326), 'Palarivattom JN', 'KWA', now() - interval '10 days', 19),
  ('Water Station - Kalamassery', 'drinking_water', 'usable', 'limited', ST_SetSRID(ST_MakePoint(76.2082801, 10.0910344), 4326), 'Kalamassery', 'KWA', now() - interval '35 days', 6),
  ('Water Kiosk - CUSAT', 'drinking_water', 'no_water', 'wheelchair', ST_SetSRID(ST_MakePoint(76.2182027, 10.0755893), 4326), 'CUSAT Campus', 'KWA', now() - interval '50 days', 2);
