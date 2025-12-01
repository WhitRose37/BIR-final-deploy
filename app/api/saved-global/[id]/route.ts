import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// GET: ดูรายละเอียดชิ้นส่วน
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const part = await prisma.savedPartGlobal.findUnique({
      where: { id },
    });

    if (!part) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// PUT: แก้ไขข้อมูล
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      commonNameEn,
      commonNameTh,
      functionEn,
      functionTh,
      whereUsedEn,
      whereUsedTh,
      characteristicsOfMaterialEn,
      characteristicsOfMaterialTh,
      uom,
    } = body;

    const updated = await prisma.savedPartGlobal.update({
      where: { id },
      data: {
        commonNameEn: commonNameEn || undefined,
        commonNameTh: commonNameTh || undefined,
        functionEn: functionEn || undefined,
        functionTh: functionTh || undefined,
        whereUsedEn: whereUsedEn || undefined,
        whereUsedTh: whereUsedTh || undefined,
        characteristicsOfMaterialEn: characteristicsOfMaterialEn || undefined,
        characteristicsOfMaterialTh: characteristicsOfMaterialTh || undefined,
        uom: uom || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// DELETE: ลบชิ้นส่วน
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const part = await prisma.savedPartGlobal.findUnique({
      where: { id },
    });

    if (!part) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.savedPartGlobal.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
