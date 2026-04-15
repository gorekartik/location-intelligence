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
    console.log('Enabling PostGIS extension...');
    try {
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('✅ PostGIS extension enabled.');
    } catch (e) {
        console.error('❌ Failed to enable PostGIS:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
