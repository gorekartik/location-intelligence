import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Defensive environment variable loading for development monorepo
// Resolving the .env file path manually if not found
if (!process.env.DATABASE_URL) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Look for .env in the root (../../../.env)
    const envPath = path.resolve(__dirname, '../../../.env');
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
}

// Extend globalThis to include our prisma instance
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma Client
 * 
 * In development, Next.js hot-reloads can create multiple instances of PrismaClient,
 * which can exhaust database connections. This pattern ensures only one instance exists.
 * 
 * In production, we create a new instance since the module is loaded once.
 */
export const prisma = globalThis.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store the instance in globalThis during development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
