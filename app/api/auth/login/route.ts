import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const password = body?.password;

    console.log("[login] 🔍 Attempting login for:", email);

    if (!email || !password) {
      console.log("[login] ❌ Missing credentials");
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("[login] ❌ User not found");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("[login] 📧 User found:", user.email);
    console.log("[login] 🔐 Comparing passwords...");

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    console.log("[login] ✅ Password valid:", isValidPassword);

    if (!isValidPassword) {
      console.log("[login] ❌ Invalid password");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("[login] ✅ Password valid, creating session...");

    // สร้าง session
    const session = await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        token: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: req.headers.get("user-agent") || "unknown",
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    console.log("[login] 🎫 Session created:", session.id);

    // ตั้ง cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    console.log("[login] ✅ Login successful");

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (e: any) {
    console.error("[login] ❌ Error:", e);
    return NextResponse.json({
      error: e?.message || "Internal server error"
    }, { status: 500 });
  }
}
