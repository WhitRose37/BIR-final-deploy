import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    console.log("[search-by-name] 🔍 Searching for:", query);

    // ✅ SQLite: ลบ mode: "insensitive" (ไม่รองรับ)
    // ✅ ใช้ contains ธรรมดา (case-sensitive แต่ทำงานได้)
    const results = await prisma.savedPartGlobal.findMany({
      where: {
        OR: [
          { productName: { contains: query } },
          { commonNameEn: { contains: query } },
          { commonNameTh: { contains: query } },
          { characteristicsOfMaterialEn: { contains: query } },
          { characteristicsOfMaterialTh: { contains: query } },
        ],
      },
      take: 50,
      orderBy: [
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        partNumber: true,
        productName: true,
        commonNameEn: true,
        commonNameTh: true,
        characteristicsOfMaterialEn: true,
        characteristicsOfMaterialTh: true,
        imagesJson: true,
        createdAt: true,
      },
    });

    console.log("[search-by-name] ✅ Found:", results.length, "results");

    return NextResponse.json({ results });
  } catch (e: any) {
    console.error("[search-by-name] ❌ Error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
