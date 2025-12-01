const bcrypt = require('bcrypt');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 12, (err, hash) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('✅ Password:', password);
  console.log('🔐 Hash:', hash);
  console.log('\n📋 Copy this hash to Prisma Studio:');
  console.log(hash);
});
