import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env manually for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

import { prisma } from './client.js';

async function main() {
    const landmarkCount = await prisma.landmark.count();
    const locationCount = await prisma.location.count();

    console.log(`--- Database Statistics ---`);
    console.log(`Total Landmarks: ${landmarkCount}`);
    console.log(`Total Locations: ${locationCount}`);

    if (landmarkCount > 0) {
        const sample = await prisma.$queryRaw`SELECT name, category, ST_AsText(position) as pos FROM "Landmark" LIMIT 3`;
        console.log(`Sample Landmarks:`, sample);
    }

    await prisma.$disconnect();
}

main();
