import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const part = body?.part;

  if (!part || !part.part_number) {
    return NextResponse.json({ error: "part.part_number is required" }, { status: 400 });
  }

  const saved = await prisma.savedPartGlobal.upsert({
    where: { partNumber: String(part.part_number) },
    update: {
      productName: part.product_name || null,
      commonNameEn: part.common_name_en || null,
      commonNameTh: part.common_name_th || null,
      uom: part.uom || null,
      characteristicsOfMaterialEn: part.characteristics_of_material_en || null,
      characteristicsOfMaterialTh: part.characteristics_of_material_th || null,
      functionEn: part.function_en || null,
      functionTh: part.function_th || null,
      whereUsedEn: part.where_used_en || null,
      whereUsedTh: part.where_used_th || null,
      eccn: part.eccn || null,
      hts: part.hts || null,
      coo: part.coo || null,
      tagsJson: Array.isArray(part.tags) ? part.tags : null,
      imagesJson: Array.isArray(part.images) ? part.images : null,
      sourcesJson: Array.isArray(part.sources) ? part.sources : null,
      createdById: user?.id ?? null,
      createdByName: user?.name ?? null,
      updatedAt: new Date(),
    },
    create: {
      partNumber: String(part.part_number),
      productName: part.product_name || null,
      commonNameEn: part.common_name_en || null,
      commonNameTh: part.common_name_th || null,
      uom: part.uom || null,
      characteristicsOfMaterialEn: part.characteristics_of_material_en || null,
      characteristicsOfMaterialTh: part.characteristics_of_material_th || null,
      functionEn: part.function_en || null,
      functionTh: part.function_th || null,
      whereUsedEn: part.where_used_en || null,
      whereUsedTh: part.where_used_th || null,
      eccn: part.eccn || null,
      hts: part.hts || null,
      coo: part.coo || null,
      tagsJson: Array.isArray(part.tags) ? part.tags : null,
      imagesJson: Array.isArray(part.images) ? part.images : null,
      sourcesJson: Array.isArray(part.sources) ? part.sources : null,
      createdById: user?.id ?? null,
      createdByName: user?.name ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
