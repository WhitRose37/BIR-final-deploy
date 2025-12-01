import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const FIXED_PASSWORD = "admin12345";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username?.trim();
    const password = body?.password;

    if (!username) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้" },
        { status: 400 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    if (password !== FIXED_PASSWORD) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    console.log("🔍 Simple Login:", username);

    // หา user หรือสร้างใหม่
    let user = await prisma.user.findFirst({
      where: {
        name: {
          equals: username,
          // SQLite ไม่รองรับ mode: "insensitive"
        },
      },
    });

    if (!user) {
      // สร้าง user ใหม่
      console.log("✨ Creating new user:", username);
      
      // Generate unique email
      const email = `${username.toLowerCase().replace(/\s+/g, '_')}@temp.local`;
      
      user = await prisma.user.create({
        data: {
          name: username,
          email,
          passwordHash: "none", // ไม่ใช้ password hash จริง
          role: "USER",
          status: "ACTIVE",
        },
      });
    }

    console.log("✅ User found/created:", user.id, user.name);

    // สร้าง session
    const session = await prisma.session.create({
      data: {
        token: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: req.headers.get("user-agent") || "unknown",
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    console.log("🎫 Session created:", session.id);

    // ตั้ง cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ 
      ok: true, 
      user: { 
        id: user.id, 
        name: user.name,
        email: user.email,
        role: user.role 
      } 
    });
  } catch (e: any) {
    console.error("Simple login error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
