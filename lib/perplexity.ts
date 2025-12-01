// เปลี่ยนเป็นใช้ OpenAI API (ChatGPT)

type Source = { name: string; url?: string; text: string };
type SummarizeArgs = { prompt: string; sources: Source[] };

function bundle(prompt: string, sources: Source[]) {
  const join = sources.map(
    (s, i) => `SOURCE #${i + 1}: ${s.name}${s.url ? `\nURL: ${s.url}` : ""}\n---\n${s.text}`
  ).join("\n\n====\n\n");
  return `${prompt}

Rules:

=== SOURCES BEGIN ===
${join}
=== SOURCES END ===`;
}

export async function gptSummarizeFromSources(args: SummarizeArgs): Promise<{ content: string; model: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  if (!args?.prompt || !args?.sources?.length) throw new Error("invalid args");

  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a precise technical summarizer for manufacturing/BOM." },
        { role: "user", content: bundle(args.prompt, args.sources) },
      ],
      temperature: 0.0,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text || res.statusText}`);

  const j = JSON.parse(text);
  const content = j?.choices?.[0]?.message?.content ?? "";
  const usage = j?.usage;

  if (!content) throw new Error("Empty completion from OpenAI");
  return { content, model, usage };
}
