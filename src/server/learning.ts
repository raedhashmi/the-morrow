import "server-only";
import { db } from "@/lib/db";
import type { InteractionType, InterestKind } from "@/generated/prisma/client";
import { topicLabel } from "@/lib/topics";

/**
 * How each reader action nudges the interest model.
 * topic / source deltas apply to the article's topic and publisher;
 * keyword delta applies to salient words in a liked/saved headline.
 */
const EFFECTS: Record<InteractionType, { topic: number; source: number; keyword: number }> = {
  OPEN: { topic: 0.15, source: 0.1, keyword: 0.05 },
  LIKE: { topic: 0.35, source: 0.2, keyword: 0.2 },
  SAVE: { topic: 0.25, source: 0.15, keyword: 0.15 },
  DISLIKE: { topic: -0.3, source: -0.25, keyword: -0.1 },
  SKIP: { topic: -0.06, source: -0.04, keyword: 0 },
  HIDE_TOPIC: { topic: -2, source: 0, keyword: 0 },
  RECALL_CORRECT: { topic: 0.1, source: 0, keyword: 0.05 },
  RECALL_WRONG: { topic: 0, source: 0, keyword: 0 },
};

const MIN = 0;
const MAX = 5;

const STOP = new Set(
  "a an the and or but of to in on for with at by from as is are was were be been has have had will would can could should may might this that these those it its into over after before about than then there their they them his her she he you your our we us not no new says say said how why what who when where which amid more most up out off just".split(
    " ",
  ),
);

/**
 * Salient entities in a headline: proper nouns and acronyms ("Babar Azam",
 * "OpenAI", "SBP"), never stop-words. These make far better
 * learned interests than generic words like "changed" or "numbers".
 */
export function salientWords(title: string, n = 2): string[] {
  const tokens = title.replace(/[\u2018\u2019'"“”:;,.!?()[\]]/g, " ").split(/\s+/).filter(Boolean);
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

async function bump(userId: string, kind: InterestKind, label: string, delta: number, createIfMissing: boolean) {
  if (!label || delta === 0) return;
  const existing = await db.interest.findUnique({ where: { userId_kind_label: { userId, kind, label } } });
  if (existing) {
    const weight = Math.max(MIN, Math.min(MAX, existing.weight + delta));
    await db.interest.update({ where: { id: existing.id }, data: { weight } });
  } else if (createIfMissing && delta > 0) {
    await db.interest.create({ data: { userId, kind, label, weight: Math.min(MAX, 0.4 + delta), origin: "LEARNED" } });
  }
}

export async function recordInteraction(userId: string, articleId: string, type: InteractionType) {
  const article = await db.article.findFirst({
    where: { id: articleId, edition: { userId } },
    select: { id: true, topic: true, source: true, title: true, serendipity: true },
  });
  if (!article) return null;

  // One opinion per article per type (likes/dislikes are toggles on the client).
  if (type !== "OPEN") {
    const dup = await db.interaction.findFirst({ where: { userId, articleId, type } });
    if (dup) return article;
  }
  await db.interaction.create({
    data: { userId, articleId, type, topic: article.topic, source: article.source },
  });

  const fx = EFFECTS[type];
  const topicKind: InterestKind = article.topic.startsWith("kw:") ? "KEYWORD" : "TOPIC";
  const topicKey = article.topic.replace(/^kw:/, "");
  // Engaging with a "beyond your bubble" story teaches the paper a new topic.
  await bump(userId, topicKind, topicKey, fx.topic, article.serendipity || topicKind === "TOPIC");
  await bump(userId, "SOURCE", article.source, fx.source, fx.source > 0.12);
  // Skip words that merely repeat the topic's own name ("artificial", "intelligence"…).
  const topicWords = new Set(topicLabel(article.topic).toLowerCase().split(/\W+/));
  const words = salientWords(article.title, 4).filter((w) => !topicWords.has(w)).slice(0, 2);
  if (fx.keyword > 0) {
    for (const w of words) await bump(userId, "KEYWORD", w, fx.keyword, type === "LIKE" || type === "SAVE");
  } else if (fx.keyword < 0) {
    for (const w of words) await bump(userId, "KEYWORD", w, fx.keyword, false);
  }
  return article;
}

/** Gently fade learned signals that haven't been reinforced, so tastes can change. */
export async function decayLearned(userId: string) {
  const stale = new Date(Date.now() - 3 * 86_400_000);
  const rows = await db.interest.findMany({
    where: { userId, origin: "LEARNED", updatedAt: { lt: stale } },
    select: { id: true, weight: true },
  });
  for (const r of rows) {
    const w = r.weight * 0.92;
    if (w < 0.15) await db.interest.delete({ where: { id: r.id } });
    else await db.interest.update({ where: { id: r.id }, data: { weight: w } });
  }
}
