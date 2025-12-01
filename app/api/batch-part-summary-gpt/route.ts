export const runtime = "nodejs";
import { NextResponse } from "next/server";
import OpenAI from "openai";

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const apiKey = process.env.OPENAI_API_KEY || (process.env['OPENAI_API_KEY'] as string);
const openai = new OpenAI({ apiKey });

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const { part_numbers } = await req.json();
    if (!Array.isArray(part_numbers)) {
      return NextResponse.json({ error: "part_numbers must be an array" }, { status: 400 });
    }
    // เรียก GPT API เพื่อสรุปข้อมูลแต่ละ part number
    const results = await Promise.all(
      part_numbers.map(async (pn: string) => {
        const prompt = `สรุปข้อมูล part number: ${pn} ในรูปแบบ: { part_number, product_name, common_name_en, common_name_th, uom, summary }`;
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        });
        let partData;
        try {
          partData = JSON.parse(completion.choices[0].message?.content || "{}");
        } catch {
          partData = {
            part_number: pn,
            product_name: `Product for ${pn}`,
            common_name_en: `Common EN ${pn}`,
            common_name_th: `ชื่อสามัญ ${pn}`,
            uom: "EA",
            summary: `This is a summary for part ${pn}.`,
          };
        }
        return partData;
      })
    );
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
