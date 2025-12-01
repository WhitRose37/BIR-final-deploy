import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { part_numbers } = await req.json();
    if (!Array.isArray(part_numbers)) {
      return NextResponse.json({ error: "part_numbers must be an array" }, { status: 400 });
    }
    // Mock summary data for each part number
    const results = part_numbers.map((pn: string, idx: number) => ({
      part_number: pn,
      product_name: `Product for ${pn}`,
      common_name_en: `Common EN ${pn}`,
      common_name_th: `ชื่อสามัญ ${pn}`,
      uom: "EA",
      summary: `This is a summary for part ${pn}.`,
    }));
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
