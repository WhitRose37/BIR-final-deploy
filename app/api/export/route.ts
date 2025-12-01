import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "catalog"; // catalog or saved-parts

    let data: any[] = [];

    if (type === "catalog") {
      // Export My Catalog
      const favorites = await prisma.savedPartFavorite.findMany({
        where: { userId: user.id },
        include: { Glossary: true, SavedPartGlobal: true },
        orderBy: { createdAt: "desc" },
      });

      data = favorites.map((fav) => {
        const item = fav.Glossary || fav.SavedPartGlobal;
        return {
          "Part Number": item?.partNumber || "",
          "Common Name (EN)": item?.commonNameEn || "",
          "Common Name (TH)": item?.commonNameTh || "",
          "Product Name": fav.SavedPartGlobal?.productName || "",
          "UOM": item?.uom || "",
          "Characteristics (EN)": item?.characteristicsOfMaterialEn || "",
          "Characteristics (TH)": item?.characteristicsOfMaterialTh || "",
          "Description (EN)": item?.longEn || "",
          "Description (TH)": item?.longTh || "",
          "Created At": new Date(fav.createdAt).toLocaleString(),
        };
      });
    } else if (type === "saved-parts") {
      // Export Saved Parts (Global)
      const parts = await prisma.savedPartGlobal.findMany({
        orderBy: { createdAt: "desc" },
      });

      data = parts.map((part) => ({
        "Part Number": part.partNumber,
        "Product Name": part.productName || "",
        "Common Name (EN)": part.commonNameEn || "",
        "Common Name (TH)": part.commonNameTh || "",
        "UOM": part.uom || "",
        "Characteristics (EN)": part.characteristicsOfMaterialEn || "",
        "Characteristics (TH)": part.characteristicsOfMaterialTh || "",
        "Description (EN)": part.longEn || "",
        "Description (TH)": part.longTh || "",
        "ECCN": part.eccn || "",
        "HTS": part.hts || "",
        "COO": part.coo || "",
        "Created By": part.createdByName || "",
        "Created At": new Date(part.createdAt).toLocaleString(),
      }));
    }

    const csv = convertToCSV(data);
    const filename = `${type}-export-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
