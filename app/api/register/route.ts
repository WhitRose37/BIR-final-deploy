import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const avatarFile = formData.get("avatar") as File | null;

    if (!email?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.trim() } 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Convert avatar to base64 if provided
    let avatarData = null;
    if (avatarFile) {
      const buffer = await avatarFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      avatarData = `data:${avatarFile.type};base64,${base64}`;
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        passwordHash: hashedPassword,
        name: name.trim(),
        avatar: avatarData,
      },
    });

    const session = await prisma.session.create({
      data: {
        token: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers.get("user-agent") || "unknown",
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ 
      ok: true, 
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } 
    });
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
