/** Pure text helpers shared by the paper engine (no server deps — unit-tested). */

export const STOP = new Set(
  "a an the and or but of to in on for with at by from as is are was were be been has have had will would can could should may might this that these those it its into over after before about than then there their they them his her she he you your our we us not no new says say said how why what who when where which amid more most up out off just".split(
    " ",
  ),
);

export function stripHtml(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function clip(s: string, n: number) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : cut) + "…";
}

/** Normalised headline used for de-duplication across providers. */
export function normTitle(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Salient entities in a headline: proper nouns and acronyms ("Babar Azam",
 * "OpenAI", "SBP"), never stop-words. These make far better learned interests
 * than generic words like "changed" or "numbers".
 */
export function salientWords(title: string, n = 2): string[] {
  const tokens = title.replace(/[‘’'"“”:;,.!?()[\]]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  // Title Case headlines capitalise everything — then trust only acronyms and camelCase.
  const capRatio = tokens.filter((t) => /^[A-Z]/.test(t)).length / Math.max(1, tokens.length);
  const titleCase = capRatio > 0.6;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const clean = t.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean.length < 3 || STOP.has(clean) || /^\d+$/.test(clean)) continue;
    const acronym = /^[A-Z][A-Z0-9]{1,5}$/.test(t) || /^[a-z]+[A-Z]/.test(t) || /^[A-Z][a-z]+[A-Z]/.test(t);
    // The first word is capitalised anyway, so only an acronym counts there.
    const proper = acronym || (i > 0 && !titleCase && /^[A-Z][a-z]+[A-Za-z0-9-]*$/.test(t));
    if (proper && !out.includes(clean)) out.push(clean);
  }
  return out.slice(0, n);
}
