import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: Request) {
  try {
    const now = new Date();
    // find active sessions (not expired) and include user
    const sessions = await prisma.session.findMany({
      where: { expiresAt: { gt: now } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // dedupe users by id and build lightweight user objects
    const seen = new Set<string>();
    const users: Array<{ id: string; name?: string | null; email?: string | null; avatar?: string | null; lastSessionAt?: string }> = [];

    for (const s of sessions) {
      const u = s.user;
      if (!u) continue;
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      users.push({
        id: u.id,
        name: u.name ?? null,
        email: u.email ?? null,
        avatar: u.avatar ?? null,
        lastSessionAt: s.createdAt?.toISOString() ?? null,
      });
      if (users.length >= 50) break;
    }

    return NextResponse.json({ ok: true, count: users.length, users });
  } catch (err: any) {
    console.error("[dashboard/online] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
