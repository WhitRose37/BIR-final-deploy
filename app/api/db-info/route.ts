import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function maskDatabaseUrl(raw: string | undefined) {
  if (!raw) return null;
  try {
    if (raw.startsWith("mysql://") || raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
      const u = new URL(raw);
      if (u.password) u.password = "********";
      if (u.username) u.username = "****";
      return u.toString();
    }
  } catch {
    // fallthrough
  }
  // sqlite or file-based or unknown format — mask file path partially
  if (raw.startsWith("file:")) {
    return raw.replace(/file:(.+)/, "file:****");
  }
  return raw;
}

async function readPrismaProvider(schemaPath: string) {
  try {
    const content = await fs.readFile(schemaPath, "utf8");
    const providerMatch = content.match(/datasource\s+\w+\s*{[\s\S]*?provider\s*=\s*"(.*?)"/m);
    const engineMatch = content.match(/generator\s+\w+\s*{[\s\S]*?engineType\s*=\s*"(.*?)"/m);
    return {
      provider: providerMatch?.[1] ?? null,
      engineType: engineMatch?.[1] ?? null,
      raw: content.slice(0, 1024), // truncated for debug if needed
    };
  } catch (e: any) {
    return { provider: null, engineType: null, error: e?.message || String(e) };
  }
}

export async function GET(_: Request) {
  const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
  const envDb = process.env.DATABASE_URL;
  const masked = maskDatabaseUrl(envDb);

  const schemaInfo = await readPrismaProvider(schemaPath);

  // Attempt a lightweight connectivity check if Prisma client is available and DATABASE_URL present
  let connectivity: { ok: boolean; detail?: any } = { ok: false };
  if (envDb && (envDb.startsWith("mysql://") || envDb.startsWith("postgresql://") || envDb.startsWith("postgres://") || envDb.startsWith("file:"))) {
    try {
      // Use a very small, safe query. For sqlite/mysql/postgres this should work.
      const res = await prisma.$queryRawUnsafe("SELECT 1 AS res LIMIT 1");
      connectivity = { ok: true, detail: res };
    } catch (err: any) {
      connectivity = { ok: false, detail: err?.message ?? String(err) };
    }
  } else {
    connectivity = { ok: false, detail: "DATABASE_URL missing or unsupported protocol" };
  }

  const payload = {
    ok: true,
    providerInSchema: schemaInfo.provider,      // e.g., "mysql" or "sqlite"
    generatorEngineType: schemaInfo.engineType, // e.g., "library" if set
    databaseUrlMasked: masked,
    connectivity,
  };

  return NextResponse.json(payload);
}
