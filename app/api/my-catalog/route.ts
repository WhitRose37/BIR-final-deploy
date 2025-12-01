import { NextResponse } from "next/server";

export const runtime = "nodejs";

// All catalog endpoints are intentionally disabled — return 410 Gone.
function goneResponse(message = "My Catalog has been removed from this deployment") {
  return NextResponse.json(
    { error: "catalog_removed", message },
    { status: 410 }
  );
}

export async function POST(_: Request) {
  return goneResponse("POST is no longer supported for /api/my-catalog");
}

export async function GET(_: Request) {
  return goneResponse("GET is no longer supported for /api/my-catalog");
}

export async function PATCH(_: Request) {
  return goneResponse("PATCH is no longer supported for /api/my-catalog");
}

export async function DELETE(_: Request) {
  return goneResponse("DELETE is no longer supported for /api/my-catalog");
}
