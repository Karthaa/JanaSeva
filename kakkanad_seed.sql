TRUNCATE TABLE facilities CASCADE;

-- Seeding data around Kakkanad/InfoPark (Approx Lat: 10.015, Lng: 76.345)
-- Note: ST_MakePoint takes (longitude, latitude)
INSERT INTO facilities (id, type, location, is_accessible, status, last_verified_at, confidence_score) VALUES
-- 1. Very Close Toilet (Accessible, Clean)
(gen_random_uuid(), 'toilet', ST_SetSRID(ST_MakePoint(76.3455, 10.0160), 4326), true, 'clean', NOW() - INTERVAL '2 hours', 0.98),
-- 2. Close Water Point
(gen_random_uuid(), 'water', ST_SetSRID(ST_MakePoint(76.3460, 10.0145), 4326), true, 'clean', NOW() - INTERVAL '1 day', 0.95),
-- 3. Medium Distance Toilet (Broken)
(gen_random_uuid(), 'toilet', ST_SetSRID(ST_MakePoint(76.3430, 10.0155), 4326), false, 'broken', NOW() - INTERVAL '4 days', 0.45),
-- 4. Medium Distance Water (No Water)
(gen_random_uuid(), 'water', ST_SetSRID(ST_MakePoint(76.3480, 10.0170), 4326), true, 'no-water', NOW() - INTERVAL '12 hours', 0.30),
-- 5. Walking Distance Toilet (Usable but older)
(gen_random_uuid(), 'toilet', ST_SetSRID(ST_MakePoint(76.3420, 10.0120), 4326), false, 'usable', NOW() - INTERVAL '6 days', 0.75),
-- 6. InfoPark Main Gate Restroom
(gen_random_uuid(), 'toilet', ST_SetSRID(ST_MakePoint(76.3500, 10.0180), 4326), true, 'clean', NOW() - INTERVAL '1 hour', 0.99);
