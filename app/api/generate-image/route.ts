import { NextResponse } from "next/server";
import { getImagesOrGenerate } from "@/lib/pipeline/images";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const part = body.part || body.part_number;
    const fields = body.fields || body;
    if (!part) {
      return NextResponse.json({ error: "Missing part number" }, { status: 400 });
    }
    // เรียกฟังก์ชันสร้างรูปใหม่
    const images = await getImagesOrGenerate(part, fields);
    if (!images || images.length === 0) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }
    return NextResponse.json({ url: images[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
