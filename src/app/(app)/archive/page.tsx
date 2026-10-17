import Link from "next/link";
import { ArrowRight, Flame, Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { requireReader } from "@/lib/session";
import { longDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const user = await requireReader();
  const editions = await db.edition.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { _count: { select: { articles: true } }, articles: { where: { isLead: true }, select: { imageUrl: true, source: true }, take: 1 } },
    take: 120,
  });
  const opens = await db.interaction.groupBy({
    by: ["articleId"],
    where: { userId: user.id, type: "OPEN", article: { edition: { userId: user.id } } },
  });
  const openedIds = new Set(opens.map((o) => o.articleId));
  const readByEdition = new Map<string, number>();
  if (openedIds.size) {
    const rows = await db.article.findMany({ where: { id: { in: [...openedIds].filter(Boolean) as string[] } }, select: { editionId: true } });
    for (const r of rows) readByEdition.set(r.editionId, (readByEdition.get(r.editionId) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="kicker">The back issues</div>
          <h1 className="masthead mt-2 text-5xl text-cream">Archive</h1>
          <p className="mt-2 text-muted-foreground">Every edition you&apos;ve received, kept on file.</p>
        </div>
        <div className="glass flex items-center gap-6 rounded-2xl px-5 py-3">
          <Stat label="Editions" value={editions.length} />
          <Stat label="Stories read" value={openedIds.size} />
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-champagne" />
            <Stat label="Day streak" value={user.streak} />
          </div>
        </div>
      </div>

      {editions.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-10 text-center">
          <Newspaper className="mx-auto size-10 text-champagne" />
          <p className="mt-4 text-cream/80">Your first edition is waiting.</p>
          <Button asChild className="mt-5"><Link href="/paper">Read today&apos;s paper</Link></Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((e, i) => {
            const read = readByEdition.get(e.id) ?? 0;
            const pct = Math.round((read / Math.max(1, e._count.articles)) * 100);
            return (
              <Link
                key={e.id}
                href={`/paper/${e.id}`}
                className="glass glass-hover group flex flex-col rounded-3xl p-6 animate-in fade-in-0 slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center justify-between text-[0.66rem] uppercase tracking-[0.2em] text-champagne/80">
                  <span>No. {e.number}</span>
                  <span>{e._count.articles} stories</span>
                </div>
                <div className="rule-double my-3" />
                <div className="font-serif text-sm text-cream/60 italic">{longDate(e.date)}</div>
                <h2 className="masthead mt-2 line-clamp-3 flex-1 text-2xl leading-tight text-cream">{e.headline}</h2>
                <div className="mt-5">
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-wine-400 to-champagne" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{read ? `${read} read` : "Unread"}</span>
                    <span className="inline-flex items-center gap-1 text-champagne opacity-0 transition group-hover:opacity-100">
                      Open <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="masthead text-2xl leading-none text-cream">{value}</div>
      <div className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}
