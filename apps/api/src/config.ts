import 'dotenv/config';

// Ensure env vars are loaded
if (!process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL not set');
}
