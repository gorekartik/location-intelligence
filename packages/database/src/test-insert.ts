import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

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
    console.log('Attempting direct insert into "Landmark"...');

    const id = uuidv4();
    const name = 'Test Landmark ' + Date.now();
    const category = 'test';
    const hours = JSON.stringify({ open: '24/7' });
    const lat = 12.9716;
    const lon = 77.5946;

    try {
        const point = `POINT(${lon} ${lat})`;
        const result = await prisma.$executeRawUnsafe(`
      INSERT INTO "Landmark" ("id", "name", "category", "hours", "rating", "position", "updatedAt")
      VALUES (
        '${id}', 
        '${name.replace(/'/g, "''")}', 
        '${category}', 
        '${hours}'::jsonb, 
        4.5, 
        ST_GeomFromText('${point}', 4326),
        NOW()
      )
    `);
        console.log('Insert successful, result:', result);

        const check = await prisma.$queryRaw`SELECT * FROM "Landmark" WHERE id = ${id}`;
        console.log('Record found after insert:', check);

    } catch (err: any) {
        console.error('Insert failed!');
        console.error('Error message:', err.message);
        console.error('Full error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
