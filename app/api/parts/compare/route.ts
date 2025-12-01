import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body; // array of favorite IDs

    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
      return NextResponse.json(
        { error: "Please select 2-3 items to compare" },
        { status: 400 }
      );
    }

    const favorites = await prisma.savedPartFavorite.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      include: { Glossary: true, SavedPartGlobal: true },
    });

    if (favorites.length !== ids.length) {
      return NextResponse.json({ error: "Some items not found" }, { status: 404 });
    }

    const parts = favorites.map((fav) => fav.Glossary || fav.SavedPartGlobal);

    return NextResponse.json({ parts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
