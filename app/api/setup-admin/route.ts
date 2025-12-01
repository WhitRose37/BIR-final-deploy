import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const runtime = "nodejs";

// ⚠️ DANGER: ลบ route นี้หลัง setup เสร็จ
export async function POST(req: Request) {
  try {
    // ✅ ตั้งค่า admin credentials
    const ADMIN_EMAIL = "admin@example.com";
    const ADMIN_PASSWORD = "admin123"; // ⚠️ เปลี่ยนเป็นรหัสที่แข็งแรงกว่านี้
    const ADMIN_NAME = "Admin User";

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existing) {
      return NextResponse.json({
        message: "Admin already exists",
        email: existing.email,
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: hashedPassword,
        name: ADMIN_NAME,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      message: "✅ Admin user created successfully",
      email: admin.email,
      password: ADMIN_PASSWORD, // ⚠️ แสดงครั้งเดียว
      note: "⚠️ DELETE THIS ROUTE AFTER SETUP",
    });
  } catch (e: any) {
    console.error("Setup admin error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
