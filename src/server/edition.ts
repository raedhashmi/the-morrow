import "server-only";
import { db } from "@/lib/db";
import { todayIn } from "@/lib/utils";
import { normTitle } from "@/lib/text";
import { DEPTHS, TOPICS, TOPIC_BY_ID, topicLabel } from "@/lib/topics";
import { gather, type Candidate } from "./sources";
import { editEdition } from "./ai";
import { decayLearned } from "./learning";
import { loadFixtures } from "./fixtures";

type Scored = Candidate & { score: number; serendipity: boolean; matched: string[] };

const norm = normTitle;

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class EditionError extends Error {}

/** Build (or return) the reader's edition for today. */
export async function buildEdition(userId: string, opts: { force?: boolean } = {}) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { interests: true } });
  const date = todayIn(user.timezone);

  const existing = await db.edition.findUnique({ where: { userId_date: { userId, date } } });
  if (existing && !opts.force) return existing;

  await decayLearned(userId);
  const interests = await db.interest.findMany({ where: { userId } });

  const topicW = new Map<string, number>();
  const sourceW = new Map<string, number>();
  const keywordW = new Map<string, number>();
  for (const i of interests) {
    if (i.kind === "TOPIC") topicW.set(i.label, i.weight);
    else if (i.kind === "SOURCE") sourceW.set(i.label.toLowerCase(), i.weight);
    else keywordW.set(i.label.toLowerCase(), i.weight);
  }
  const activeTopics = [...topicW.entries()].filter(([, w]) => w >= 0.25).sort((a, b) => b[1] - a[1]);
  const searchKeywords = interests
    .filter((i) => i.kind === "KEYWORD" && (i.origin === "ONBOARDING" || i.weight >= 1.5) && i.weight >= 0.25)
    .map((i) => i.label)
    .slice(0, 8);

  // Two "beyond your bubble" topics, rotating daily.
  const outside = TOPICS.filter((t) => !topicW.has(t.id));
  const seed = hashString(userId + date);
  const serendipityTopics = outside.length
    ? [outside[seed % outside.length], outside[(seed >> 3) % outside.length]].filter((t, i, a) => a.indexOf(t) === i)
    : [];

  const topicsToFetch = [
    ...activeTopics.map(([id]) => TOPIC_BY_ID.get(id)).filter(Boolean),
    ...serendipityTopics,
  ] as { id: string; query: string; feeds?: string[] }[];

  let candidates = await gather({ topics: topicsToFetch, keywords: searchKeywords, region: user.region, city: user.city });
  if (candidates.length === 0 && process.env.MORROW_FIXTURES === "1") candidates = loadFixtures(topicsToFetch.map((t) => t.id));
  if (candidates.length === 0) throw new EditionError("We couldn't reach our news sources just now. Please try again in a minute.");

  // ── Filter: muted words, already-seen stories, duplicates ──
  const muted = user.mutedWords.map((w) => w.toLowerCase()).filter(Boolean);
  const recent = await db.article.findMany({
    where: { edition: { userId, createdAt: { gte: new Date(Date.now() - 10 * 86_400_000) } } },
    select: { url: true, title: true },
  });
  const seen = new Set([...recent.map((r) => r.url), ...recent.map((r) => norm(r.title))]);
  const dedupe = new Set<string>();
  const serendipityIds = new Set(serendipityTopics.map((t) => t.id));

  const scored: Scored[] = [];
  for (const c of candidates) {
    const key = norm(c.title);
    if (key.length < 12 || dedupe.has(key) || seen.has(c.url) || seen.has(key)) continue;
    const lower = c.title.toLowerCase() + " " + c.summary.toLowerCase();
    if (muted.some((m) => lower.includes(m))) continue;
    if (c.publishedAt && Date.now() - c.publishedAt.getTime() > 4 * 86_400_000) continue;
    dedupe.add(key);

    const isKw = c.topic.startsWith("kw:");
    const tWeight = isKw
      ? keywordW.get(c.topic.slice(3).toLowerCase()) ?? 1
      : c.topic === "local"
        ? 1
        : topicW.get(c.topic) ?? 0.5;
    const sWeight = sourceW.get(c.source.toLowerCase()) ?? 0;
    const matched = [...keywordW.entries()].filter(([k]) => k.length > 2 && lower.includes(k));
    const kwBoost = matched.reduce((a, [, w]) => a + w * 0.35, 0);
    const ageH = c.publishedAt ? (Date.now() - c.publishedAt.getTime()) / 3_600_000 : 24;
    const recency = Math.exp(-Math.max(ageH, 0) / 20);

    let score = tWeight * 1.0 + sWeight * 0.45 + Math.min(kwBoost, 1.5) + recency * 0.9;
    if (c.imageUrl) score += 0.12;
    if (c.summary.length > 60) score += 0.12;
    const serendipity = serendipityIds.has(c.topic);
    if (serendipity) score = 0.6 + recency; // scored separately, never crowds out interests
    scored.push({ ...c, score, serendipity, matched: matched.map(([k]) => k) });
  }

  // ── Select with diversity: per-topic quotas proportional to interest weight ──
  const depth = DEPTHS.find((d) => d.id === user.readingDepth) ?? DEPTHS[1];
  const total = depth.count;
  const mainPool = scored.filter((s) => !s.serendipity).sort((a, b) => b.score - a.score);
  const bubblePool = scored.filter((s) => s.serendipity).sort((a, b) => b.score - a.score);

  const weightSum = activeTopics.reduce((a, [, w]) => a + w, 0) + searchKeywords.length * 0.8 + (user.city ? 0.6 : 0) || 1;
  const quota = (topic: string) => {
    const w = topic.startsWith("kw:") ? 0.8 : topic === "local" ? 0.6 : topicW.get(topic) ?? 0.5;
    return Math.max(1, Math.round((w / weightSum) * total) + 1);
  };
  const perTopic = new Map<string, number>();
  const perSource = new Map<string, number>();
  const chosen: Scored[] = [];
  const mainSlots = total - Math.min(2, bubblePool.length);
  for (const s of mainPool) {
    if (chosen.length >= mainSlots) break;
    if ((perTopic.get(s.topic) ?? 0) >= quota(s.topic)) continue;
    if ((perSource.get(s.source) ?? 0) >= 3) continue;
    chosen.push(s);
    perTopic.set(s.topic, (perTopic.get(s.topic) ?? 0) + 1);
    perSource.set(s.source, (perSource.get(s.source) ?? 0) + 1);
  }
  // top up if quotas left gaps
  for (const s of mainPool) {
    if (chosen.length >= mainSlots) break;
    if (!chosen.includes(s)) chosen.push(s);
  }
  const bubble = bubblePool.slice(0, total - chosen.length > 0 ? Math.min(2, total - chosen.length) : 0);
  if (chosen.length === 0) throw new EditionError("Nothing new matched your interests today. Try adding a few more topics.");

  // ── Lay out sections ──
  chosen.sort((a, b) => b.score - a.score);
  const lead = chosen.find((c) => c.imageUrl && c.summary) ?? chosen[0];
  const front = [lead];
  for (const c of chosen) {
    if (front.length >= 4) break;
    if (c === lead || front.filter((f) => f.topic === c.topic).length >= 2) continue;
    front.push(c);
  }
  for (const c of chosen) if (front.length < 4 && !front.includes(c)) front.push(c);
  const rest = chosen.filter((c) => !front.includes(c));

  type Placed = Scored & { section: string; rank: number; isLead: boolean };
  const placed: Placed[] = front.map((c, i) => ({ ...c, section: "Front Page", rank: i, isLead: i === 0 }));
  const bySection = new Map<string, Scored[]>();
  for (const c of rest) {
    const sec = c.topic === "local" ? `${user.city ?? "Local"}` : topicLabel(c.topic);
    bySection.set(sec, [...(bySection.get(sec) ?? []), c]);
  }
  const sectionOrder = [...bySection.entries()].sort(
    (a, b) => Math.max(...b[1].map((x) => x.score)) - Math.max(...a[1].map((x) => x.score)),
  );
  for (const [sec, items] of sectionOrder) items.forEach((c, i) => placed.push({ ...c, section: sec, rank: i, isLead: false }));
  bubble.forEach((c, i) => placed.push({ ...c, section: "Beyond Your Bubble", rank: i, isLead: false }));

  // ── Editorial layer: AI if available, heuristics otherwise ──
  const first = (user.name || user.username || "reader").split(" ")[0];
  const interestNames = activeTopics.slice(0, 6).map(([id]) => topicLabel(id));
  const ai = await editEdition({
    readerName: first,
    persona: user.persona,
    depth: depth.label,
    interests: [...interestNames, ...searchKeywords],
    stories: placed.map((p, i) => ({ i, title: p.title, source: p.source, topic: topicLabel(p.topic), snippet: p.summary.slice(0, 280) })),
  });
  const aiStory = new Map(ai?.stories.map((s) => [s.i, s]) ?? []);

  const whyHeuristic = (p: Placed) => {
    if (p.serendipity) return `Something outside your usual ${interestNames[0] ?? "reading"} — worth a look`;
    if (p.matched.length) return `Mentions ${p.matched.slice(0, 2).join(" & ")}, which you follow`;
    if (p.topic.startsWith("kw:")) return `You asked us to watch for “${p.topic.slice(3)}”`;
    if (p.topic === "local") return `News from ${user.city}`;
    const sw = sourceW.get(p.source.toLowerCase()) ?? 0;
    if (sw > 0.6) return `From ${p.source}, a source you often read`;
    return `Because you follow ${topicLabel(p.topic)}`;
  };

  const headline = ai?.headline?.trim() || lead.title;
  const editorNote =
    ai?.editorNote?.trim() ||
    `Good morning, ${first}. Today's paper leads with ${topicLabel(lead.topic).toLowerCase()}, with ${placed.length} stories chosen from ${new Set(placed.map((p) => p.source)).size} sources across ${interestNames.slice(0, 3).join(", ") || "your interests"}. Skip what doesn't land — tomorrow's edition will notice.`;

  const takeaways =
    ai?.takeaways?.length
      ? ai.takeaways.slice(0, 3).map((t) => ({ i: t.i, point: t.point }))
      : placed.filter((p) => !p.serendipity).slice(0, 3).map((p) => ({ i: placed.indexOf(p), point: p.title }));

  const number = (await db.edition.count({ where: { userId } })) + (existing ? 0 : 1);

  const data = placed.map((p, i) => {
    const words = (aiStory.get(i)?.summary || p.summary || "").split(/\s+/).length;
    return {
      section: p.section,
      rank: p.rank,
      isLead: p.isLead,
      serendipity: p.serendipity,
      title: p.title,
      url: p.url,
      source: p.source,
      topic: p.topic,
      summary: aiStory.get(i)?.summary?.trim() || p.summary || "",
      whyHere: aiStory.get(i)?.whyHere?.trim() || whyHeuristic(p),
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt,
      readMinutes: Math.max(2, Math.round(words / 40) + 2),
      score: Math.round(p.score * 1000) / 1000,
    };
  });

  const edition = await db.$transaction(async (tx) => {
    if (existing) await tx.edition.delete({ where: { id: existing.id } });
    const ed = await tx.edition.create({
      data: {
        userId,
        date,
        number: existing ? existing.number : number,
        headline,
        editorNote,
        articles: { create: data },
      },
      include: { articles: { orderBy: { rank: "asc" } } },
    });
    // Map takeaway indices (positions in `placed`) to article ids.
    const byTitle = new Map(ed.articles.map((a) => [a.url + a.title, a.id]));
    const tk = takeaways
      .map((t) => {
        const p = placed[t.i];
        return p ? { articleId: byTitle.get(p.url + p.title), point: t.point } : null;
      })
      .filter(Boolean);
    return tx.edition.update({ where: { id: ed.id }, data: { takeaways: tk } });
  });
  return edition;
}
