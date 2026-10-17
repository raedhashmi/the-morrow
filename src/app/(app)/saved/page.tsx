import Link from "next/link";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { db } from "@/lib/db";
import { requireReader } from "@/lib/session";
import { longDate } from "@/lib/utils";
import { topicLabel } from "@/lib/topics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await requireReader();
  const saves = await db.interaction.findMany({
    where: { userId: user.id, type: "SAVE", articleId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: { article: { include: { edition: { select: { id: true, date: true } } } } },
    take: 200,
  });
  const items = saves.filter((s) => s.article);
  return (
    <div>
      <div className="kicker">Your clippings</div>
      <h1 className="masthead mt-2 text-5xl text-cream">Saved</h1>
      <p className="mt-2 text-muted-foreground">Stories you put aside to come back to.</p>
      {items.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-10 text-center">
          <Bookmark className="mx-auto size-10 text-champagne" />
          <p className="mt-4 text-cream/80">Tap the bookmark on any story to keep it here.</p>
          <Button asChild className="mt-5"><Link href="/paper">Back to today</Link></Button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4">
          {items.map(({ id, article }) => (
            <li key={id} className="glass glass-hover flex flex-col gap-2 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge>{topicLabel(article!.topic)}</Badge>
                  <span className="text-xs text-muted-foreground">{article!.source}</span>
                </div>
                <a href={article!.url} target="_blank" rel="noreferrer" className="mt-2 block font-serif text-xl leading-snug text-cream hover:text-white">
                  {article!.title} <ArrowUpRight className="inline size-4 text-champagne" />
                </a>
              </div>
              <Link href={`/paper/${article!.edition.id}`} className="shrink-0 text-xs text-champagne/80 hover:text-champagne">
                From {longDate(article!.edition.date)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
