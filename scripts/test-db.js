const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Attempting to connect to the database...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const userCount = await prisma.user.count();
        console.log(`📊 Current user count: ${userCount}`);

    } catch (e) {
        console.error('❌ Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
