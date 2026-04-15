import './config.js';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { sourcingService } from './services/sourcing.service.js';
import { MapController } from './controllers/map.controller.js';

const server: FastifyInstance = Fastify({
    logger: true
});

// Register CORS plugin for frontend requests
await server.register(cors, {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || ''   // Production frontend URL (set in Render env vars)
    ].filter(Boolean),
    credentials: true
});

server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

server.get('/api/location-intel', MapController.getLocationIntel);

/**
 * Trigger data sourcing from Overpass and optional web scraping
 */
server.post('/sourcing/fetch', async (request, reply) => {
    const { lat, lon, radius, targetUrl } = request.body as any;

    if (!lat || !lon) {
        return reply.status(400).send({ error: 'lat and lon are required' });
    }

    try {
        // 1. Fetch from Overpass
        const overpassData = await sourcingService.queryOverpass(lat, lon, radius);
        const benchmarks = sourcingService.sanitizeOverpassData(overpassData);

        // 2. Optional: Scrape real estate
        let scrapedData = [];
        if (targetUrl) {
            scrapedData = await sourcingService.scrapeRealEstate(targetUrl);
            // In a real scenario, we'd sanitize and merge this data too
        }

        // 3. Save to database
        await sourcingService.saveLandmarks(benchmarks);

        return {
            message: 'Sourcing completed',
            landmarksFound: benchmarks.length,
            scrapedListings: scrapedData.length
        };
    } catch (error: any) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Sourcing failed', details: error.message });
    }
});

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
