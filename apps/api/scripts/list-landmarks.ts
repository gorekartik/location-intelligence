import { prisma } from '@packages/database';

async function listLandmarks() {
    try {
        const count = await prisma.landmark.count();
        console.log(`Total landmarks: ${count}`);
        if (count > 0) {
            const landmarks = await prisma.$queryRaw`SELECT name, category, ST_AsText(position) as pos FROM "Landmark" LIMIT 5`;
            console.log('Sample Landmarks:', JSON.stringify(landmarks, null, 2));
        }
    } catch (e) {
        console.error('Error fetching landmarks:', e);
    } finally {
        await prisma.$disconnect();
    }
}

listLandmarks();
