const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('👤 Create Admin User');
    console.log('-------------------');

    try {
        const email = await askQuestion('Email: ');
        const password = await askQuestion('Password: ');
        const name = await askQuestion('Name (optional): ');

        if (!email || !password) {
            console.error('❌ Email and password are required.');
            process.exit(1);
        }

        console.log('\n⏳ Creating admin user...');

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                name: name || undefined
            },
            create: {
                email,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                name: name || 'Admin User'
            }
        });

        console.log(`\n✅ Admin user created/updated successfully!`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);

    } catch (e) {
        console.error('\n❌ Error creating admin user:', e);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main();
