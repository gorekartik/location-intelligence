import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@packages/database";
import { GeminiService } from "../services/gemini.service.js";
import { sourcingService } from "../services/sourcing.service.js";
import { coverageService } from "../services/coverage.service.js";

const geminiService = new GeminiService();

export class MapController {
    static async getLocationIntel(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { lat, lng } = req.query as { lat: string; lng: string };

            if (!lat || !lng) {
                return reply.status(400).send({ error: "Missing lat or lng parameters" });
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

            if (isNaN(latitude) || isNaN(longitude)) {
                return reply.status(400).send({ error: "Invalid coordinates" });
            }

            // 1. Spatial Logic: Zoning (Green: 0-5km, Yellow: 5-10km, Blue: 10-15km)
            // Using Raw SQL for PostGIS ST_DWithin performance
            // Note: ST_DWithin takes distance in meters if using geography, or degrees if geometry.
            // Assuming 'position' is geography or we cast to geography.
            // The schema says `Unsupported("geometry(Point, 4326)")`. 
            // 4326 is separate usage (degrees). To use meters, we should cast to geography or use ST_DistanceSphere/Spheroid or accept degrees.
            // ST_DWithin(geom, geom, distance_degrees)
            // 1 degree ~ 111km. 5km is approx 0.045 degrees.
            // BETTER: ST_DWithin(position::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)

            const tStart = Date.now();

            // Step 0: Guarantee data exists for this area.
            // If the area was never indexed, this fetches from Overpass, cleans the
            // data, saves it to DB, and records a coverage row — all before the
            // spatial query below runs. Subsequent calls for the same area skip
            // the Overpass call entirely (returns "db_cache" immediately).
            const dataSource = await coverageService.ensureCoverage(latitude, longitude);
            const tCoverage = Date.now();
            console.log(`Coverage check/fetch took: ${tCoverage - tStart}ms (source: ${dataSource})`);

            // Step 1: Spatial query — always reads from DB (data guaranteed above)
            const landmarks: any[] = await prisma.$queryRaw`
                SELECT id, name, category, rating, hours, ST_AsGeoJSON(position)::json as position,
                       ST_Distance(position::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) as distance
                FROM "Landmark"
                WHERE ST_DWithin(position::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, 4500)
            `;

            const tSpatial = Date.now();
            console.log(`Spatial Query took: ${tSpatial - tCoverage}ms`);

            const greenZone = landmarks.filter(l => l.distance <= 1500);
            const yellowZone = landmarks.filter(l => l.distance > 1500 && l.distance <= 3000);
            const blueZone = landmarks.filter(l => l.distance > 3000 && l.distance <= 4500);

            // Step 2: Connectivity
            const roads = await sourcingService.getRoadNetwork(latitude, longitude);
            const tRoads = Date.now();
            console.log(`Road Network took: ${tRoads - tSpatial}ms`);

            // Step 3: Gemini intelligence summary
            const allLandmarks = [...(greenZone as any[]), ...(yellowZone as any[]), ...(blueZone as any[])];
            const summary = await geminiService.generateLocationSummary(allLandmarks);
            const tGemini = Date.now();
            console.log(`Gemini Summary took: ${tGemini - tRoads}ms`);

            console.log(`Total Controller time: ${tGemini - tStart}ms`);

            return reply.send({
                zones: {
                    green: greenZone,
                    yellow: yellowZone,
                    blue: blueZone
                },
                connectivity: roads,
                summary,
                debug: {
                    dataSource,
                    coverage: tCoverage - tStart,
                    spatial: tSpatial - tCoverage,
                    roads: tRoads - tSpatial,
                    gemini: tGemini - tRoads,
                    total: tGemini - tStart
                }
            });

        } catch (error: any) {
            console.error("Error in getLocationIntel:", error);
            // Log the full error to see stack trace and Prisma details
            if (error.code) console.error("Prisma Error Code:", error.code);
            if (error.meta) console.error("Prisma Error Meta:", JSON.stringify(error.meta));

            return reply.status(500).send({
                error: "Internal Server Error",
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}
