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
    console.log('--- Database Connection Test ---');
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));

    try {
        // 1. List all tables
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Tables in public schema:', tables);

        // 2. Check columns of Landmark
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'Landmark'
    `;
        console.log('Columns in "Landmark":', columns);

        // 3. Check extensions
        const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension
    `;
        console.log('Installed extensions:', extensions);

        // 4. Count records in Landmark
        const count = await prisma.$queryRaw`SELECT COUNT(*) FROM "Landmark"`;
        console.log('Count in "Landmark":', count);

        // 5. Check for any data at all
        const allData = await prisma.$queryRaw`SELECT * FROM "Landmark" LIMIT 5`;
        console.log('Sample data from "Landmark":', allData);

    } catch (err: any) {
        console.error('Database query failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
