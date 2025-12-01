import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const email = "admin@example.com";
const password = "admin123";

try {
  // Generate fresh hash for admin123
  const passwordHash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE" },
    create: { 
      email, 
      passwordHash, 
      name: "Admin",
      role: "ADMIN",
      status: "ACTIVE"
    },
  });
  
  console.log("✅ Seeded admin user:");
  console.log("   Email:", user.email);
  console.log("   Password: admin123");
  console.log("   Role:", user.role);
} catch (e) {
  console.error("❌ Seed error:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
