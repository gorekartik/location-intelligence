-- Enable PostGIS extension for spatial data support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Note: Tables will be created by Prisma db push
-- This migration focuses on PostGIS extension and RLS policies

-- Enable Row Level Security on Location table
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on Landmark table
ALTER TABLE "Landmark" ENABLE ROW LEVEL SECURITY;

-- Create public read policy for Location table (allow anonymous SELECT)
CREATE POLICY "Allow public read access on Location"
ON "Location"
FOR SELECT
TO anon
USING (true);

-- Create public read policy for Landmark table (allow anonymous SELECT)
CREATE POLICY "Allow public read access on Landmark"
ON "Landmark"
FOR SELECT
TO anon
USING (true);

-- Optional: Allow authenticated users full access
CREATE POLICY "Allow authenticated full access on Location"
ON "Location"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on Landmark"
ON "Landmark"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
