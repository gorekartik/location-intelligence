import { prisma } from '@packages/database';

async function addGistIndex() {
    try {
        console.log('Adding GIST index to Landmark("position")...');
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS landmark_position_gist_idx ON "Landmark" USING GIST (position);
        `);
        console.log('Successfully added GIST index.');
    } catch (e) {
        console.error('Error adding GIST index:', e);
    } finally {
        await prisma.$disconnect();
    }
}

addGistIndex();
