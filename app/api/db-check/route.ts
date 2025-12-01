import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: Request) {
  // 1) ตรวจ DATABASE_URL ก่อน
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not set in environment.",
        hint: 'Add DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME" to your .env'
      },
      { status: 500 }
    );
  }

  if (!dbUrl.startsWith("mysql://")) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL must start with the protocol mysql://",
        value: dbUrl,
        hint: 'Ensure .env uses a MySQL connection string, e.g. mysql://root:secret@localhost:3306/partgen'
      },
      { status: 400 }
    );
  }

  // 2) Try a simple query via Prisma
  try {
    // simple lightweight query to validate connection
    const result: any = await prisma.$queryRaw`SELECT 1 AS res`;
    return NextResponse.json({
      ok: true,
      connected: true,
      sampleQuery: result,
      note: "Prisma connected and DB responded to a test query."
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Prisma query failed",
        message: err?.message ?? String(err),
        hint: "Check MySQL service, credentials, port (3306) and firewall. Try `mysql -u USER -p -h HOST` locally."
      },
      { status: 500 }
    );
  }
}
