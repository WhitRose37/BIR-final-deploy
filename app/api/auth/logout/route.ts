import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      // ลบ session จาก database
      await prisma.session.deleteMany({ where: { token } });
    }

    // ลบ cookie
    cookieStore.delete("session_token");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[logout] Error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
