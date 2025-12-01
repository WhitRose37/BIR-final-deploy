import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalGlossary,
      totalFavorites,
      totalSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: { equals: "ACTIVE" } } }),
      prisma.user.count({ where: { status: { equals: "SUSPENDED" } } }),
      prisma.glossary.count(),
      prisma.savedPartFavorite.count(),
      prisma.session.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalGlossary,
        totalFavorites,
        totalSessions,
      },
      recentUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
