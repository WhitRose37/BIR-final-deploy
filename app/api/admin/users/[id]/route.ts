import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// GET: ดูรายละเอียด user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const userDetail = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!userDetail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count searches (saved favorites)
    const searchCount = await prisma.savedPartFavorite.count({
      where: { userId: id },
    });

    // Count saved items
    const savedCount = await prisma.savedPartFavorite.count({
      where: { userId: id },
    });

    // Get last activity
    const lastActivity = await prisma.savedPartFavorite.findFirst({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return NextResponse.json({
      ...userDetail,
      searchCount,
      savedCount,
      lastActivityAt: lastActivity?.createdAt || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, status } = body;

    // OWNER สามารถสร้าง ADMIN ได้ แต่ ADMIN ไม่สามารถสร้าง OWNER
    if (role === "OWNER" && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only OWNER can create OWNER accounts" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        role: role || undefined,
        status: status || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
