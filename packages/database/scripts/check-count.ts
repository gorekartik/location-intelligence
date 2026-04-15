
import { prisma } from '../src/index.js';

async function checkCount() {
    try {
        const count = await prisma.landmark.count();
        console.log(`Total landmarks: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCount();
