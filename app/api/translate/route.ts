import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

async function translateText(text: string, targetLang: "th" | "en"): Promise<string> {
  try {
    if (!text) return "";

    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not configured");

    const prompt =
      targetLang === "th"
        ? `Translate the following English text to Thai. Keep technical terms accurate. Only return the translated text, no explanations.\n\nText: ${text}`
        : `Translate the following Thai text to English. Keep technical terms accurate. Only return the translated text, no explanations.\n\nText: ${text}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // หรือ "gpt-4" ตามต้องการ
        messages: [
          {
            role: "system",
            content:
              "You are a professional technical translator. Translate accurately while preserving technical terminology.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Perplexity API error:", error);
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    const translated = data?.choices?.[0]?.message?.content || text;
    return translated.trim();
  } catch (e) {
    console.error("Translation error:", e);
    return text; // Return original if translation fails
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "text and targetLang required" },
        { status: 400 }
      );
    }

    const translated = await translateText(text, targetLang);

    return NextResponse.json({
      original: text,
      translated,
      targetLang,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
