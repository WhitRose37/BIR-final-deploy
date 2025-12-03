const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('👤 Create Admin User (Auto)');
    console.log('-------------------');

    const email = 'admin@example.com';
    const password = 'password123';
    const name = 'Admin User';

    try {
        console.log('\n⏳ Creating admin user...');

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                name: name
            },
            create: {
                email,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                name: name
            }
        });

        console.log(`\n✅ Admin user created/updated successfully!`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${user.role}`);

    } catch (e) {
        console.error('\n❌ Error creating admin user:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
