
-- Seed some landmarks around Times Square (40.7580, -73.9855)
-- Green Zone (within 5km)
INSERT INTO "Landmark" ("id", "name", "category", "hours", "rating", "position", "updatedAt")
VALUES 
(uuid_generate_v4(), 'Times Square Cafe', 'cafe', '{}'::jsonb, 4.8, ST_SetSRID(ST_MakePoint(-73.9855, 40.7580), 4326), NOW()),
(uuid_generate_v4(), 'Broadway Hub', 'office', '{}'::jsonb, 4.5, ST_SetSRID(ST_MakePoint(-73.9840, 40.7590), 4326), NOW());

-- Yellow Zone (5-10km)
INSERT INTO "Landmark" ("id", "name", "category", "hours", "rating", "position", "updatedAt")
VALUES 
(uuid_generate_v4(), 'Central Park South Market', 'marketplace', '{}'::jsonb, 4.2, ST_SetSRID(ST_MakePoint(-73.9730, 40.7650), 4326), NOW());

-- Blue Zone (10-15km)
INSERT INTO "Landmark" ("id", "name", "category", "hours", "rating", "position", "updatedAt")
VALUES 
(uuid_generate_v4(), 'Upper East Side Monument', 'monument', '{}'::jsonb, 4.6, ST_SetSRID(ST_MakePoint(-73.9500, 40.7800), 4326), NOW());
