import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireReader } from "@/lib/session";
import { longDate, todayIn } from "@/lib/utils";
import { EditionReader, type ReaderArticle } from "@/components/paper/edition-reader";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ed = await db.edition.findUnique({ where: { id }, select: { date: true } });
  return { title: ed ? longDate(ed.date) : "Paper" };
}

export default async function EditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireReader();
  const edition = await db.edition.findFirst({
    where: { id, userId: user.id },
    include: { articles: { orderBy: [{ rank: "asc" }] } },
  });
  if (!edition) notFound();

  const interactions = await db.interaction.findMany({
    where: { userId: user.id, articleId: { in: edition.articles.map((a) => a.id) } },
    select: { articleId: true, type: true },
  });
  const state = new Map<string, Set<string>>();
  for (const i of interactions) {
    if (!i.articleId) continue;
    state.set(i.articleId, (state.get(i.articleId) ?? new Set()).add(i.type));
  }

  const articles: ReaderArticle[] = edition.articles.map((a) => ({
    id: a.id,
    section: a.section,
    rank: a.rank,
    isLead: a.isLead,
    serendipity: a.serendipity,
    title: a.title,
    url: a.url,
    source: a.source,
    topic: a.topic,
    summary: a.summary,
    whyHere: a.whyHere,
    imageUrl: a.imageUrl,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    readMinutes: a.readMinutes,
    liked: state.get(a.id)?.has("LIKE") ?? false,
    disliked: state.get(a.id)?.has("DISLIKE") ?? false,
    saved: state.get(a.id)?.has("SAVE") ?? false,
    skipped: state.get(a.id)?.has("SKIP") ?? false,
    opened: state.get(a.id)?.has("OPEN") ?? false,
    remembered: state.get(a.id)?.has("RECALL_CORRECT") ?? false,
  }));

  // Front page first, then sections by their strongest story, "Beyond Your Bubble" last.
  const best = new Map<string, number>();
  for (const a of edition.articles) best.set(a.section, Math.max(best.get(a.section) ?? -Infinity, a.score));
  const rankOf = (s: string) => (s === "Front Page" ? -1 : s === "Beyond Your Bubble" ? 1 : 0);
  const sectionOrder = [...best.keys()].sort((a, b) => rankOf(a) - rankOf(b) || (best.get(b)! - best.get(a)!));

  return (
    <EditionReader
      edition={{
        id: edition.id,
        date: edition.date,
        number: edition.number,
        headline: edition.headline,
        editorNote: edition.editorNote,
        takeaways: (edition.takeaways as { articleId: string; point: string }[] | null) ?? [],
        isToday: edition.date === todayIn(user.timezone),
        city: user.city,
      }}
      sections={sectionOrder}
      articles={articles}
    />
  );
}
