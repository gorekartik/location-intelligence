import fs from 'fs';
import path from 'path';

// Load .env manually before importing prisma
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

import { prisma } from './client';

async function main() {
    console.log('Starting PostGIS verification...');

    try {
        // 1. Create a Location with a POINT
        // Note: We use raw SQL for insertion because Prisma doesn't support PostGIS types natively in write operations without extensions or raw queries in some versions,
        // but here we defined it as Unsupported("geometry(Point, 4326)"), so we must use $executeRaw or similar for strict types if not using a specific extension.
        // However, for Unsupported types, we usually need to handle them carefully.
        // Let's rely on Prisma's ability to handle raw SQL for the geometry column.

        const locationName = 'Test Location ' + Date.now();

        // Using $executeRaw to insert data with PostGIS geometry
        // This is often necessary when working with Unsupported types directly if client extensions aren't set up for it
        // Or we can try to use the model if prisma-client-js generated proper types (usually it generates strings for Unsupported).

        // Let's try creating a record using standard prisma create if possible, but since it's "Unsupported", 
        // we might need to assume it's not directly writable as an object property without $queryRaw or specialized handling.
        // Wait, usually people use `dbgenerated` or raw queries.
        // Let's try the raw query approach for safety as it's most reliable for initial verification of PostGIS.

        console.log('Creating test location...');
        const id = crypto.randomUUID();

        // ST_GeomFromText('POINT(77.5946 12.9716)', 4326) -> Bangalore coordinates
        const insertResult = await prisma.$executeRaw`
      INSERT INTO "Location" ("id", "position", "updatedAt")
      VALUES (${id}, ST_GeomFromText('POINT(77.5946 12.9716)', 4326), NOW())
    `;

        console.log('Insert result:', insertResult);

        // 2. Retrieve the Location and verify the POINT
        console.log('Retrieving test location...');
        // We cast the geometry to text to make it readable in JS
        const result = await prisma.$queryRaw`
      SELECT id, ST_AsText(position) as position_text
      FROM "Location"
      WHERE id = ${id}
    `;

        console.log('Retrieved result:', result);

        if (Array.isArray(result) && result.length > 0) {
            const record = result[0] as any;
            console.log(`Verified: Found location ${record.id} with position ${record.position_text}`);

            if (record.position_text === 'POINT(77.5946 12.9716)') {
                console.log('✅ SUCCESS: PostGIS Point saved and retrieved correctly!');
            } else {
                console.error('❌ FAILURE: Position text did not match expected value.');
            }
        } else {
            console.error('❌ FAILURE: Could not retrieve the inserted record.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await prisma.$executeRaw`DELETE FROM "Location" WHERE id = ${id}`;

    } catch (e) {
        console.error('❌ ERROR during verification:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
