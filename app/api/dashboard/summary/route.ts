import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTotalUsage } from "@/lib/tokenUsage";

export const runtime = "nodejs";

function monthKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(_: Request) {
  try {
    // compute last 12 months window (inclusive)
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)); // start of current month
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1, 0, 0, 0)); // 11 months before -> 12 months total

    // fetch records in window (only createdAt + createdByName)
    const rows = await prisma.savedPartGlobal.findMany({
      where: {
        createdAt: { gte: start },
      },
      select: {
        createdAt: true,
        createdByName: true,
        createdById: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // initialize months
    const months: string[] = [];
    const ptr = new Date(start);
    while (ptr <= end) {
      months.push(monthKey(ptr));
      ptr.setUTCMonth(ptr.getUTCMonth() + 1);
    }

    const monthlyCounts: Record<string, number> = {};
    for (const m of months) monthlyCounts[m] = 0;

    // tally counts and user totals
    const userCounts: Record<string, number> = {};
    for (const r of rows) {
      const k = monthKey(new Date(r.createdAt));
      if (!(k in monthlyCounts)) monthlyCounts[k] = 0;
      monthlyCounts[k] += 1;

      const uname = (r.createdByName && String(r.createdByName).trim()) || (r.createdById && String(r.createdById)) || "anonymous";
      userCounts[uname] = (userCounts[uname] || 0) + 1;
    }

    // format monthly array (sorted ascending)
    const monthly = months.map((m) => ({ month: m, count: monthlyCounts[m] || 0 }));

    // top users from TokenUsage (Activity based)
    const usageGroups = await prisma.tokenUsage.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
      where: {
        createdAt: { gte: start }
      }
    });

    // Fetch user names
    const userIds = usageGroups.map(g => g.userId).filter(id => id !== null) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const topUsers = usageGroups.map(g => {
      const u = users.find(user => user.id === g.userId);
      return {
        name: u?.name || (g.userId ? "Unknown User" : "Anonymous"),
        count: g._count.id
      };
    });

    // Total Generated (Activity based)
    const total = await prisma.tokenUsage.count({
      where: {
        createdAt: { gte: start }
      }
    });

    // DAILY: counts for current month days 1..31 (UTC)
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

    // Fetch TokenUsage for activity volume (actual generations)
    const usageRows = await prisma.tokenUsage.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth
        }
      },
      select: { createdAt: true }
    });

    const dailyCountsArr: { day: number; count: number }[] = [];
    // initialize 1..31
    for (let d = 1; d <= 31; d++) dailyCountsArr.push({ day: d, count: 0 });

    // count usage in current month
    for (const r of usageRows) {
      const dt = new Date(r.createdAt);
      const day = dt.getUTCDate(); // 1..31
      if (day >= 1 && day <= 31) dailyCountsArr[day - 1].count += 1;
    }

    const tokenStats = await getTotalUsage();

    return NextResponse.json({
      ok: true,
      periodStart: months[0],
      periodEnd: months[months.length - 1],
      total,
      monthly,
      daily: dailyCountsArr,
      topUsers,
      tokenStats,
    });
  } catch (e: any) {
    console.error("[dashboard/summary] error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
