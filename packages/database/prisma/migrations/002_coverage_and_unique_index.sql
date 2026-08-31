-- ============================================================
-- Migration 002: On-Demand Location Sourcing Schema
-- Run this in Supabase Dashboard → SQL Editor if
-- `prisma db push` cannot reach the DB directly.
-- ============================================================

-- 1. Add UNIQUE constraint on Landmark(name, category)
--    Required by the ON CONFLICT upsert in saveLandmarks().
--    IF NOT EXISTS guard makes this idempotent (safe to re-run).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Landmark_name_category_key'
          AND conrelid = '"Landmark"'::regclass
    ) THEN
        ALTER TABLE "Landmark"
            ADD CONSTRAINT "Landmark_name_category_key" UNIQUE (name, category);
    END IF;
END $$;

-- 2. Create LocationCoverage table
--    Tracks which 15 km radius areas have been sourced from Overpass.
--    Prevents redundant Overpass API calls on repeat requests.
CREATE TABLE IF NOT EXISTS "LocationCoverage" (
    "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusM"   INTEGER     NOT NULL DEFAULT 4500,
    "fetchedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "LocationCoverage_pkey" PRIMARY KEY ("id")
);

-- 3. Enable Row Level Security (consistent with Landmark table policy)
ALTER TABLE "LocationCoverage" ENABLE ROW LEVEL SECURITY;

-- Public read policy (same as Landmark)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'LocationCoverage'
          AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
            ON "LocationCoverage"
            FOR SELECT
            TO anon
            USING (true);
    END IF;
END $$;

-- Service role full access policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'LocationCoverage'
          AND policyname = 'Allow authenticated full access'
    ) THEN
        CREATE POLICY "Allow authenticated full access"
            ON "LocationCoverage"
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
