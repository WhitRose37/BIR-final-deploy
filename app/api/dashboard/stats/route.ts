import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Today's searches
    const todaySearches = await prisma.savedPartGlobal.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // This week's searches
    const weekSearches = await prisma.savedPartGlobal.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Total searches
    const totalSearches = await prisma.savedPartGlobal.count();

    // Daily stats for last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.savedPartGlobal.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    // Top 5 parts
    const allParts = await prisma.savedPartGlobal.findMany({
      select: { partNumber: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const partCounts: { [key: string]: number } = {};
    allParts.forEach((part) => {
      partCounts[part.partNumber] = (partCounts[part.partNumber] || 0) + 1;
    });

    const topParts = Object.entries(partCounts)
      .map(([partNumber, count]) => ({ partNumber, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const [totalUsers, totalParts] = await Promise.all([
      prisma.user.count(),
      prisma.savedPartGlobal.count(),
    ]);

    return NextResponse.json({
      todaySearches,
      weekSearches,
      totalSearches,
      dailyStats,
      topParts,
      totalUsers,
      totalParts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
