import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * ⚠️ TEMPORARY ENDPOINT - Delete after creating admin user
 * 
 * Usage:
 * 1. Register normally via /register
 * 2. Login
 * 3. Call POST /api/promote-me with secret key
 * 4. You become ADMIN
 * 5. DELETE THIS FILE
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { secret } = body;

    // ✅ Secret key to prevent abuse (change this!)
    const PROMOTION_SECRET = process.env.PROMOTION_SECRET || "BIR_ADMIN_2025";

    if (secret !== PROMOTION_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 403 }
      );
    }

    // Promote current user to ADMIN
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "✅ You are now an ADMIN!",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
    });
  } catch (e: any) {
    console.error("Promote error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
