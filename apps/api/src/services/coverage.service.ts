import { prisma } from '@packages/database';
import { sourcingService } from './sourcing.service.js';

const COVERAGE_RADIUS_M = 4500;

/**
 * CoverageService — the bridge between the query pipeline and the sourcing pipeline.
 *
 * When a user searches a location, this service guarantees the DB has landmark
 * data for that area before the spatial query runs. It does this by:
 *   1. Checking the LocationCoverage table for any record whose center is within
 *      15 km of the requested coordinates (meaning this area was already fetched).
 *   2. If no record exists → fetch from Overpass, clean, save landmarks, then
 *      insert a coverage record so future requests skip the Overpass call.
 *
 * Returns a dataSource string so the controller can tell the frontend where the
 * data came from ("db_cache" | "overpass_live").
 */
export class CoverageService {
    /**
     * Ensure landmark data exists in the DB for the given coordinates.
     * @returns "db_cache" if data was already present, "overpass_live" if freshly fetched.
     */
    async ensureCoverage(lat: number, lng: number): Promise<'db_cache' | 'overpass_live'> {
        // --- 1. Check if any existing coverage record covers this point ---
        // A coverage row "covers" the point if the stored center is within
        // COVERAGE_RADIUS_M of the requested point (using PostGIS geography).
        const existing: any[] = await prisma.$queryRaw`
            SELECT id FROM "LocationCoverage"
            WHERE ST_DWithin(
                ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                ${COVERAGE_RADIUS_M}
            )
            LIMIT 1
        `;

        if (existing.length > 0) {
            console.log(`[Coverage] Cache HIT for (${lat}, ${lng}) — serving from DB.`);
            return 'db_cache';
        }

        // --- 1.5. Backwards Compatibility Check ---
        // If there are already landmarks in this area (e.g., from manual sourcing before LocationCoverage existed),
        // we can assume the area is covered and insert a coverage record to prevent redundant Overpass queries.
        const existingLandmarks: any[] = await prisma.$queryRaw`
            SELECT id FROM "Landmark"
            WHERE ST_DWithin(
                position::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                ${COVERAGE_RADIUS_M}
            )
            LIMIT 50
        `;

        if (existingLandmarks.length >= 10) {
            console.log(`[Coverage] Legacy Cache HIT for (${lat}, ${lng}) — backfilling coverage record.`);

            // Record coverage so future requests hit step 1 directly
            await prisma.$executeRaw`
                INSERT INTO "LocationCoverage" ("id", "centerLat", "centerLng", "radiusM", "fetchedAt")
                VALUES (gen_random_uuid(), ${lat}, ${lng}, ${COVERAGE_RADIUS_M}, NOW())
            `;

            return 'db_cache';
        }

        // --- 2. Cache MISS — fetch live from Overpass ---
        console.log(`[Coverage] Cache MISS for (${lat}, ${lng}) — fetching from Overpass...`);

        const rawData = await sourcingService.queryOverpass(lat, lng, COVERAGE_RADIUS_M);
        const landmarks = sourcingService.sanitizeOverpassData(rawData);

        console.log(`[Coverage] Overpass returned ${rawData.length} elements → ${landmarks.length} valid landmarks.`);

        // --- 3. Save landmarks to DB ---
        await sourcingService.saveLandmarks(landmarks);

        // --- 4. Record coverage so future requests skip Overpass ---
        await prisma.$executeRaw`
            INSERT INTO "LocationCoverage" ("id", "centerLat", "centerLng", "radiusM", "fetchedAt")
            VALUES (gen_random_uuid(), ${lat}, ${lng}, ${COVERAGE_RADIUS_M}, NOW())
        `;

        console.log(`[Coverage] Indexed ${landmarks.length} landmarks for (${lat}, ${lng}).`);

        return 'overpass_live';
    }
}

export const coverageService = new CoverageService();
