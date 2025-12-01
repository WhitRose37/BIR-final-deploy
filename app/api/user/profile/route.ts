import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        avatar: avatar?.trim() || null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e: any) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
