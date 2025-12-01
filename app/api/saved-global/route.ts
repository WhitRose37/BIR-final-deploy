import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// ------- helpers -------
const toStr = (v: any) => (v ?? "") as string;
const toArr = <T = unknown>(v: any): T[] => (Array.isArray(v) ? v : []);

// ===== POST: upsert (save from Generator) =====
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      part_number,
      project_name,
      product_name,
      common_name_en,
      common_name_th,
      uom,
      characteristics_of_material_en,
      characteristics_of_material_th,
      estimated_capacity_machine_year,
      quantity_to_use,
      function_en,
      function_th,
      where_used_en,
      where_used_th,
      long_en,
      long_th,
      eccn,
      hts,
      coo,
      tags = [],
      images = [],
      sources = [],
    } = body;

    if (!part_number) {
      return NextResponse.json(
        { error: "part_number is required" },
        { status: 400 }
      );
    }

    const part = await prisma.savedPartGlobal.upsert({
      where: { partNumber: part_number },
      update: {
        projectName: project_name,
        productName: product_name,
        commonNameEn: common_name_en,
        commonNameTh: common_name_th,
        uom,
        characteristicsOfMaterialEn: characteristics_of_material_en,
        characteristicsOfMaterialTh: characteristics_of_material_th,
        estimatedCapacityMachineYear: estimated_capacity_machine_year,
        quantityToUse: quantity_to_use,
        functionEn: function_en,
        functionTh: function_th,
        whereUsedEn: where_used_en,
        whereUsedTh: where_used_th,
        longEn: long_en,
        longTh: long_th,
        eccn,
        hts,
        coo,
        tagsJson: tags.length ? tags : null,
        imagesJson: images.length ? images : null,
        sourcesJson: sources.length ? sources : null,
        createdById: user?.id || null,
        createdByName: user?.name || "Anonymous",
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        partNumber: part_number,
        projectName: project_name,
        productName: product_name,
        commonNameEn: common_name_en,
        commonNameTh: common_name_th,
        uom,
        characteristicsOfMaterialEn: characteristics_of_material_en,
        characteristicsOfMaterialTh: characteristics_of_material_th,
        estimatedCapacityMachineYear: estimated_capacity_machine_year,
        quantityToUse: quantity_to_use,
        functionEn: function_en,
        functionTh: function_th,
        whereUsedEn: where_used_en,
        whereUsedTh: where_used_th,
        longEn: long_en,
        longTh: long_th,
        eccn,
        hts,
        coo,
        tagsJson: tags.length ? tags : null,
        imagesJson: images.length ? images : null,
        sourcesJson: sources.length ? sources : null,
        createdById: user?.id || null,
        createdByName: user?.name || "Anonymous",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, id: part.id });
  } catch (e: any) {
    console.error("Save error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// ===== GET: list with search =====
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build search filter
    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { partNumber: { contains: search, mode: "insensitive" } },
        { commonNameEn: { contains: search, mode: "insensitive" } },
        { commonNameTh: { contains: search, mode: "insensitive" } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.savedPartGlobal.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.savedPartGlobal.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      parts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// ===== PATCH: update some editable columns from modal =====
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, partNumber } = body || {};
    if (!id && !partNumber) {
      return NextResponse.json({ error: "id or partNumber is required" }, { status: 400 });
    }

    const data: any = {};
    if ("projectName" in body) data.projectName = body.projectName ?? null;
    if ("productName" in body) data.productName = body.productName ?? null;
    if ("commonNameEn" in body) data.commonNameEn = body.commonNameEn ?? null;
    if ("commonNameTh" in body) data.commonNameTh = body.commonNameTh ?? null;
    if ("uom" in body) data.uom = body.uom ?? null;
    if ("eccn" in body) data.eccn = body.eccn ?? null;
    if ("hts" in body) data.hts = body.hts ?? null;
    if ("coo" in body) data.coo = body.coo ?? null;

    // optional arrays
    if ("tags" in body) data.tagsJson = toArr<string>(body.tags);
    if ("images" in body) data.imagesJson = toArr<string>(body.images);
    if ("sources" in body) data.sourcesJson = toArr<{ name: string; url?: string }>(body.sources);

    const where = id ? { id: String(id) } : { partNumber: String(partNumber) };

    const row = await prisma.savedPartGlobal.update({ where, data });
    return NextResponse.json(row);
  } catch (err: any) {
    console.error("[saved-global] PATCH error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

// ===== DELETE: remove a record by id or partNumber =====
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const partNumber = url.searchParams.get("partNumber");

    if (!id && !partNumber) {
      return NextResponse.json({ error: "id or partNumber is required" }, { status: 400 });
    }

    const where = id ? { id } : { partNumber: String(partNumber) };
    const row = await prisma.savedPartGlobal.delete({ where });

    return NextResponse.json({ ok: true, id: row.id, partNumber: row.partNumber });
  } catch (err: any) {
    console.error("[saved-global] DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
