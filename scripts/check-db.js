const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database connection...')
  
  try {
    // Count users
    const userCount = await prisma.user.count()
    console.log(`📊 Total users: ${userCount}`)
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      }
    })
    
    console.log('\n👥 Users:')
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) [${u.status}]`)
    })
    
    // Check for admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (admin) {
      console.log('\n✅ Admin user exists!')
      console.log('   Email:', admin.email)
      console.log('   Role:', admin.role)
      console.log('   Status:', admin.status)
    } else {
      console.log('\n❌ Admin user not found')
      console.log('   Run: node scripts/seed.mjs')
    }
    
    console.log('\n📍 Database location: prisma/dev.db')
  } catch (error) {
    console.error('\n❌ Database error:', error.message)
    console.log('\nTry running:')
    console.log('  1. npx prisma generate')
    console.log('  2. npx prisma migrate dev --name init')
    console.log('  3. node scripts/seed.mjs')
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
