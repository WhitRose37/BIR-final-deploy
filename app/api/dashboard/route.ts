import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    console.log("[dashboard] 📊 Fetching dashboard data...");

    // รวมข้อมูล
    const [totalUsers, totalParts, totalSearches] = await Promise.all([
      prisma.user.count(),
      prisma.savedPartGlobal.count(),
      prisma.savedPartFavorite.count(),
    ]);

    console.log("[dashboard] ✅ Basic stats:", { totalUsers, totalParts, totalSearches });

    // ✅ Top 10 Saved Parts - แก้ไขให้ดึงข้อมูลถูกต้อง
    console.log("[dashboard] 🔍 Fetching top saved parts...");

    // ดึง favorites ทั้งหมดพร้อมข้อมูล part
    const favorites = await prisma.savedPartFavorite.findMany({
      include: {
        Glossary: {
          select: { partNumber: true },
        },
        SavedPartGlobal: {
          select: { partNumber: true },
        },
      },
    });

    console.log("[dashboard] 📦 Total favorites:", favorites.length);

    // นับจำนวนการบันทึกแต่ละ part number
    const partCounts = new Map<string, number>();

    favorites.forEach((fav) => {
      const partNumber = fav.Glossary?.partNumber || fav.SavedPartGlobal?.partNumber;
      if (partNumber) {
        partCounts.set(partNumber, (partCounts.get(partNumber) || 0) + 1);
      }
    });

    console.log("[dashboard] 🔢 Unique parts:", partCounts.size);

    // แปลงเป็น array และเรียงลำดับ
    const topSearches = Array.from(partCounts.entries())
      .map(([part_number, count]) => ({ part_number, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log("[dashboard] 🏆 Top 10 parts:", topSearches);

    // Top Users (Most Active)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // เติมข้อมูล activity count สำหรับ top users
    const topUsersWithCounts = await Promise.all(
      topUsers.map(async (user) => {
        const savedCount = await prisma.savedPartFavorite.count({
          where: { userId: user.id },
        });
        return {
          ...user,
          searchCount: savedCount,
          savedCount,
        };
      })
    );

    // Recent Favorites
    const recentSearches = await prisma.savedPartFavorite.findMany({
      include: {
        User: {
          select: {
            name: true,
          },
        },
        Glossary: {
          select: {
            partNumber: true,
          },
        },
        SavedPartGlobal: {
          select: {
            partNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    console.log("[dashboard] ✅ Dashboard data complete");

    return NextResponse.json({
      totalUsers,
      totalParts,
      totalSearches,
      topSearches,
      topUsers: topUsersWithCounts.sort((a, b) => b.searchCount - a.searchCount),
      recentSearches: recentSearches.map((log) => ({
        id: log.id,
        part_number: log.Glossary?.partNumber || log.SavedPartGlobal?.partNumber || "N/A",
        userId: log.userId,
        userName: log.User?.name || "Unknown",
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error("[dashboard] ❌ Error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
