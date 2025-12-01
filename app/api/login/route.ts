import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // เปรียบเทียบ password ด้วย bcrypt
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    console.log("🔍 Debug Login:");
    console.log("  Email:", email);
    console.log("  Password match:", isValidPassword);
    console.log("  Stored hash:", user.passwordHash.substring(0, 20) + "...");

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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

    // ตั้ง cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
