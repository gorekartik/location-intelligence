import { prisma } from '@packages/database';

async function checkIndexes() {
    try {
        const indexes: any[] = await prisma.$queryRaw`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'Landmark'
        `;
        console.log('Current Indexes on Landmark table:');
        console.log(JSON.stringify(indexes, null, 2));

        const hasGist = indexes.some(idx => idx.indexdef.toLowerCase().includes('gist'));
        if (!hasGist) {
            console.log('No GIST index found on Landmark table.');
        } else {
            console.log('GIST index found.');
        }
    } catch (e) {
        console.error('Error checking indexes:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkIndexes();
