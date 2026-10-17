import "server-only";

/**
 * Optional AI editor. When ANTHROPIC_API_KEY is set, Claude writes the edition's
 * headline, editor's note, story summaries, "why it's here" lines and the
 * three things to remember. Without a key, the paper falls back to heuristics.
 */

export type EditorInput = {
  readerName: string;
  persona: string | null;
  depth: string;
  interests: string[];
  stories: { i: number; title: string; source: string; topic: string; snippet: string }[];
};

export type EditorOutput = {
  headline: string;
  editorNote: string;
  stories: { i: number; summary: string; whyHere: string }[];
  takeaways: { i: number; point: string }[];
};

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function editEdition(input: EditorInput): Promise<EditorOutput | null> {
  if (!aiEnabled()) return null;
  const prompt = `You are the editor of "The Morrow", a personal morning newspaper written for one reader.

Reader: ${input.readerName}${input.persona ? ` (${input.persona})` : ""}. Preferred depth: ${input.depth}.
They care about: ${input.interests.join(", ")}.

Today's selected stories (index, title, source, topic, snippet):
${input.stories.map((s) => `[${s.i}] ${s.title} — ${s.source} (${s.topic}) :: ${s.snippet || "(no snippet)"}`).join("\n")}

Return ONLY valid JSON with this shape:
{
  "headline": "a short, elegant front-page headline for today's edition (max 9 words), drawn from the lead story",
  "editorNote": "2-3 warm sentences greeting the reader by first name and framing today's paper around their interests",
  "stories": [{"i": <index>, "summary": "1-2 neutral sentences explaining the story; never invent facts beyond the title/snippet", "whyHere": "max 12 words on why this reader would care"}],
  "takeaways": [{"i": <index>, "point": "one memorable sentence"}]   // exactly 3, the most important stories
}
Write summaries in your own words. If a snippet is empty, summarise only what the headline states.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      console.warn("[ai] editor failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as EditorOutput;
    if (!parsed.headline || !Array.isArray(parsed.stories)) return null;
    return parsed;
  } catch (err) {
    console.warn("[ai] editor error", (err as Error).message);
    return null;
  }
}
