import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Creating admin user...");

  const email = "admin@example.com";
  const password = "admin123"; // ⚠️ Change this in production
  
  // Check if admin exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("✅ Admin user already exists:", email);
    console.log("   ID:", existing.id);
    console.log("   Role:", existing.role);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  
  console.log("✅ Admin user created successfully!");
  console.log("   Email:", email);
  console.log("   Password:", password);
  console.log("   ID:", user.id);
  console.log("   Role:", user.role);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
