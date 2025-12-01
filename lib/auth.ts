// lib/auth.ts
import bcrypt from "bcrypt";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ✅ ต้องมี export ฟังก์ชันนี้ให้ route.ts ใช้
// lib/auth.ts (เฉพาะ createSession)
export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string }
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      token,
      userId,
      expiresAt,
      userAgent: meta?.userAgent,
      ip: meta?.ip
    },
  });

  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}


export async function destroySession() {
  const c = await cookies(); // บางกรณี Next 16 ต้อง await
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
  c.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

// --- getCurrentUser อ่าน cookie จาก header (เวิร์กใน RSC/Next 16) ---
function readCookie(name: string, cookieHeader: string) {
  const parts = cookieHeader.split(/; */);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function getCurrentUser() {
  try {
    console.log("[getCurrentUser] 🔍 Attempting to get current user...");

    const cookieStore = await cookies();

    // ✅ ลองดึง token ด้วยชื่อต่างๆ
    let token = cookieStore.get("session_token")?.value;
    console.log("[getCurrentUser] Cookie 'session_token':", token ? "✅ Found" : "❌ Not found");

    if (!token) {
      token = cookieStore.get("session")?.value;
      console.log("[getCurrentUser] Cookie 'session':", token ? "✅ Found" : "❌ Not found");
    }

    if (!token) {
      console.log("[getCurrentUser] ⚠️ No session token found in cookies");
      const allCookies = cookieStore.getAll();
      console.log("[getCurrentUser] Available cookies:", allCookies.map(c => c.name));
      return null;
    }

    console.log("[getCurrentUser] 🔐 Token found, looking up user...");

    // ✅ ใช้ token เป็น userId หรือค้นหา session?
    // ถ้า token คือ session ID ต้องค้นหา Session model ก่อน
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      console.log("[getCurrentUser] ❌ Session not found for token:", token?.substring(0, 10) + "...");
      return null;
    }

    const user = session.user;
    console.log("[getCurrentUser] ✅ User found:", user.id, user.email);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (e) {
    console.error("[getCurrentUser] ❌ Error:", e);
    return null;
  }
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value || null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}
