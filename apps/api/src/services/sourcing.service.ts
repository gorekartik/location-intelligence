import axios from 'axios';
import { chromium } from 'playwright';
import { prisma } from '../../../../packages/database/src/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

//for Debugging (stores essential details of the API calls)
const LOG_FILE = './sourcing.log';
function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

// In-memory cache to prevent redundant Overpass API calls
const overpassCache = new Map<string, any>();
const roadNetworkCache = new Map<string, any>();

export interface LandmarkInput {
    name: string;
    category: string;
    hours: any;
    rating: number;
    latitude: number;
    longitude: number;
}

export class SourcingService {
    /**
     * Queries Overpass API for landmarks within a radius
     * @param lat Latitude
     * @param lon Longitude
     * @param radius Radius in meters (max 15000 as per requirement)
     */
    async queryOverpass(lat: number, lon: number, radius: number = 15000) {
        const cacheKey = `${lat},${lon},${radius}`;
        if (overpassCache.has(cacheKey)) {
            console.log('Returning cached Overpass data');
            return overpassCache.get(cacheKey);
        }

        const query = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:${radius},${lat},${lon});
        way["amenity"~"marketplace|bank|pharmacy|hospital|restaurant|cafe"](around:${radius},${lat},${lon});
        node["building"~"commercial|retail|office"](around:${radius},${lat},${lon});
        way["building"~"commercial|retail|office"](around:${radius},${lat},${lon});
        node["historic"~"monument|memorial"](around:${radius},${lat},${lon});
        node["leisure"~"park|playground|stadium"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://overpass.openstreetmap.ru/api/interpreter'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Querying Overpass at ${endpoint}...`);
                const response = await axios.post(endpoint, `data=${encodeURIComponent(query)}`, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (response.data && response.data.elements) {
                    const data = response.data.elements;
                    overpassCache.set(cacheKey, data);
                    return data;
                }
            } catch (error: any) {
                console.warn(`Endpoint ${endpoint} failed: ${error.message}`);
                if (error.response?.status === 429) {
                    continue; // Try next endpoint on rate limit
                }
                // For other errors, also try next or throw if it's the last one
            }
        }

        throw new Error('All Overpass endpoints failed or are rate-limited.');
    }

    /**
     * Queries Overpass for road network and U-turn restrictions
     */
    async getRoadNetwork(lat: number, lon: number, radius: number = 500) {
        const cacheKey = `${lat},${lon},${radius}`;
        if (roadNetworkCache.has(cacheKey)) {
            console.log('Returning cached Road Network data');
            return roadNetworkCache.get(cacheKey);
        }

        // Radius smaller for roads to focus on immediate connectivity
        const query = `
            [out:json][timeout:25];
            (
              way["highway"~"motorway|trunk|primary|secondary"](around:${radius},${lat},${lon});
              node(around:${radius},${lat},${lon})["restriction"="no_u_turn"];
            );
            out body;
            >;
            out skel qt;
        `;

        try {
            const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const data = response.data.elements;
            roadNetworkCache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching road network:', error);
            return [];
        }
    }

    /**
     * Scrapes real estate data from a target site
     * Note: This is a template implementation targeting a generic structure.
     */
    async scrapeRealEstate(targetUrl: string) {
        console.log(`Starting scraper for ${targetUrl}`);
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

            // Simple logic to extract building names and some metadata
            // This would be customized per target site
            const listings = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.listing-card, .property-item'));
                return items.map(item => ({
                    name: item.querySelector('.title, h2')?.textContent?.trim() || 'Unknown Building',
                    price: item.querySelector('.price')?.textContent?.trim() || 'Contact for Price',
                    address: item.querySelector('.address')?.textContent?.trim() || '',
                })).slice(0, 10); // Limit for testing
            });

            return listings;
        } catch (error) {
            console.error('Scraping error:', error);
            return [];
        } finally {
            await browser.close();
        }
    }

    /**
     * Sanitizes and maps incoming data to Landmark model
     */
    sanitizeOverpassData(elements: any[]): LandmarkInput[] {
        return elements
            .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
            .map(el => ({
                name: el.tags.name || el.tags['name:en'],
                category: el.tags.amenity || el.tags.building || el.tags.historic || el.tags.leisure || 'landmark',
                hours: el.tags.opening_hours ? { opening_hours: el.tags.opening_hours } : {},
                rating: 4.0, // Default rating if not available
                latitude: el.lat || (el.center ? el.center.lat : 0),
                longitude: el.lon || (el.center ? el.center.lon : 0),
            }))
            .filter(l => l.latitude !== 0 && l.longitude !== 0);
    }

    /**
     * Saves landmarks to Supabase with upsert logic
     */
    async saveLandmarks(landmarks: LandmarkInput[]) {
        logToFile(`Starting save for ${landmarks.length} landmarks`);

        let successCount = 0;
        let failCount = 0;

        for (const landmark of landmarks) {
            try {
                // Check if exists
                const existing: any[] = await prisma.$queryRaw`
                    SELECT id FROM "Landmark"
                    WHERE "name" = ${landmark.name}
                    AND "category" = ${landmark.category}
                    LIMIT 1
                `;

                const id = existing.length > 0 ? existing[0].id : uuidv4();
                const point = `POINT(${landmark.longitude} ${landmark.latitude})`;

                // Use executeRawUnsafe to be absolutely sure about the SQL string
                // This helps avoid parameter binding issues during debugging
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "Landmark" ("id", "name", "category", "hours", "rating", "position", "updatedAt")
                    VALUES (
                        '${id}',
                        '${landmark.name.replace(/'/g, "''")}',
                        '${landmark.category}',
                        '${JSON.stringify(landmark.hours)}'::jsonb,
                        ${landmark.rating},
                        ST_GeomFromText('${point}', 4326),
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "category" = EXCLUDED."category",
                        "hours" = EXCLUDED."hours",
                        "rating" = EXCLUDED."rating",
                        "position" = EXCLUDED."position",
                        "updatedAt" = NOW()
                `);
                successCount++;
            } catch (error: any) {
                failCount++;
                if (failCount <= 5) {
                    logToFile(`Failed to save landmark "${landmark.name}": ${error.message} (Code: ${error.code})`);
                }
            }
        }
        logToFile(`Finished. Success: ${successCount}, Failed: ${failCount}`);
    }
}

export const sourcingService = new SourcingService();
