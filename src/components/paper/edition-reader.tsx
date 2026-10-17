"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  Brain,
  Check,
  Download,
  EyeOff,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, longDate } from "@/lib/utils";
import { TimeAgo } from "./time-ago";
import { topicLabel } from "@/lib/topics";

export type ReaderArticle = {
  id: string;
  section: string;
  rank: number;
  isLead: boolean;
  serendipity: boolean;
  title: string;
  url: string;
  source: string;
  topic: string;
  summary: string;
  whyHere: string;
  imageUrl: string | null;
  publishedAt: string | null;
  readMinutes: number;
  liked: boolean;
  disliked: boolean;
  saved: boolean;
  skipped: boolean;
  opened: boolean;
  remembered: boolean;
};

type Edition = {
  id: string;
  date: string;
  number: number;
  headline: string;
  editorNote: string;
  takeaways: { articleId: string; point: string }[];
  isToday: boolean;
  city: string | null;
};

type Signal = "OPEN" | "LIKE" | "DISLIKE" | "SKIP" | "SAVE" | "HIDE_TOPIC" | "RECALL_CORRECT";

function send(articleId: string, type: Signal, undo = false) {
  const body = JSON.stringify({ articleId, type, undo });
  if (type === "OPEN" && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/interactions", new Blob([body], { type: "application/json" }));
    return Promise.resolve();
  }
  return fetch("/api/interactions", { method: "POST", headers: { "content-type": "application/json" }, body }).then(() => undefined);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function EditionReader({ edition, sections, articles: initial }: { edition: Edition; sections: string[]; articles: ReaderArticle[] }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initial);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const patch = (id: string, p: Partial<ReaderArticle>) => setArticles((as) => as.map((a) => (a.id === id ? { ...a, ...p } : a)));

  const actions = {
    open(a: ReaderArticle) {
      patch(a.id, { opened: true });
      void send(a.id, "OPEN");
    },
    like(a: ReaderArticle) {
      if (a.liked) return;
      patch(a.id, { liked: true, disliked: false });
      void send(a.id, "LIKE");
      toast(`More ${topicLabel(a.topic)} coming up`, { description: "Tomorrow's paper will lean this way." });
    },
    dislike(a: ReaderArticle) {
      if (a.disliked) return;
      patch(a.id, { disliked: true, liked: false });
      void send(a.id, "DISLIKE");
      toast("Noted — less like this", { description: "We'll show fewer stories like it." });
    },
    save(a: ReaderArticle) {
      patch(a.id, { saved: !a.saved });
      void send(a.id, "SAVE", a.saved);
      toast(a.saved ? "Removed from Saved" : "Saved for later");
    },
    skip(a: ReaderArticle) {
      patch(a.id, { skipped: true });
      void send(a.id, "SKIP");
      toast("Story skipped", {
        action: { label: "Undo", onClick: () => { patch(a.id, { skipped: false }); void send(a.id, "SKIP", true); } },
      });
    },
    hideTopic(a: ReaderArticle) {
      setArticles((as) => as.map((x) => (x.topic === a.topic ? { ...x, skipped: true } : x)));
      void send(a.id, "HIDE_TOPIC");
      toast(`${topicLabel(a.topic)} muted`, { description: "You can bring it back in Settings." });
    },
    remember(a: ReaderArticle) {
      if (a.remembered) return;
      patch(a.id, { remembered: true });
      void send(a.id, "RECALL_CORRECT");
    },
  };

  const bySection = useMemo(() => {
    const m = new Map<string, ReaderArticle[]>();
    for (const a of articles) m.set(a.section, [...(m.get(a.section) ?? []), a]);
    return m;
  }, [articles]);

  const front = bySection.get("Front Page") ?? [];
  const lead = front.find((a) => a.isLead) ?? front[0];
  const others = front.filter((a) => a !== lead);
  const rest = sections.filter((s) => s !== "Front Page");
  const totalMin = articles.filter((a) => !a.skipped).reduce((n, a) => n + a.readMinutes, 0);
  const openedCount = articles.filter((a) => a.opened).length;
  const byId = new Map(articles.map((a) => [a.id, a]));

  return (
    <article className="relative">
      <div className="no-print fixed inset-x-0 top-0 z-50 h-0.5">
        <div className="h-full bg-gradient-to-r from-wine-400 via-champagne to-wine-300 transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* ───── Masthead ───── */}
      <header className="text-center animate-in fade-in-0 slide-in-from-top-2 duration-700">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-champagne/80">
          <span>No. {edition.number}</span>
          <span className="hidden sm:inline">{edition.city ? `${edition.city} edition` : "Personal edition"}</span>
          <span>~{totalMin} min read</span>
        </div>
        <div className="rule-double my-4" />
        <h1 className="masthead text-gradient text-6xl leading-[0.95] sm:text-8xl">The Morrow</h1>
        <div className="mt-3 font-serif text-lg text-cream/80 italic">{longDate(edition.date)}</div>
        <div className="rule-double my-4" />
        <div className="no-print flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="glass" size="sm">
            <a href={`/api/editions/${edition.id}/pdf`} target="_blank" rel="noreferrer">
              <Download /> Download PDF
            </a>
          </Button>
          {edition.isToday && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/paper/reprint"><RefreshCw /> Reprint</Link>
            </Button>
          )}
          {!edition.isToday && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/paper">Go to today&apos;s paper</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ───── Section nav ───── */}
      <nav className="no-print sticky top-[5.25rem] z-30 mt-8 -mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
        <div className="glass inline-flex min-w-full gap-1 rounded-full p-1 sm:min-w-0">
          {sections.map((s) => (
            <a key={s} href={`#${slug(s)}`} className="rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap text-cream/75 transition hover:bg-white/10 hover:text-cream">
              {s}
            </a>
          ))}
          <a href="#remember" className="rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap text-champagne transition hover:bg-white/10">
            Three things
          </a>
        </div>
      </nav>

      {/* ───── Editor's note ───── */}
      <section className="glass mt-8 rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Sparkles className="mt-1 size-5 shrink-0 text-champagne" />
          <div>
            <div className="kicker">From the editor</div>
            <p className="mt-2 font-serif text-xl leading-relaxed text-cream/90 italic sm:text-2xl">{edition.editorNote}</p>
          </div>
        </div>
      </section>

      {/* ───── Front page ───── */}
      <section id={slug("Front Page")} className="mt-10 scroll-mt-40">
        <SectionHead title={lead && edition.headline !== lead.title ? edition.headline : "Today's front page"} kicker="Front page" big />
        <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
          {lead && <Story a={lead} actions={actions} variant="lead" />}
          <div className="grid gap-5">
            {others.map((a) => (
              <Story key={a.id} a={a} actions={actions} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Three things ───── */}
      {edition.takeaways.length > 0 && (
        <section id="remember" className="glass-strong sheen mt-12 scroll-mt-40 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Brain className="size-5 text-champagne" />
            <div className="kicker">Three things to remember today</div>
          </div>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {edition.takeaways.map((t, i) => {
              const a = byId.get(t.articleId);
              return (
                <li key={i} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="masthead text-4xl text-champagne/80">{i + 1}</span>
                  <p className="mt-2 flex-1 font-serif text-lg leading-snug text-cream">{t.point}</p>
                  {a && (
                    <button
                      type="button"
                      onClick={() => actions.remember(a)}
                      className={cn(
                        "mt-4 inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs transition",
                        a.remembered ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/15 text-cream/70 hover:border-champagne/40 hover:text-champagne",
                      )}
                    >
                      <Check className="size-3.5" /> {a.remembered ? "Committed to memory" : "Got it"}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ───── Sections ───── */}
      {rest.map((s) => {
        const items = bySection.get(s) ?? [];
        const bubble = s === "Beyond Your Bubble";
        return (
          <section key={s} id={slug(s)} className="mt-14 scroll-mt-40">
            <SectionHead
              title={s}
              kicker={bubble ? "Something different" : `${items.length} ${items.length === 1 ? "story" : "stories"}`}
              note={bubble ? "Picked from outside your interests. Like one and it joins your paper." : undefined}
            />
            <div className={cn("grid gap-5 sm:grid-cols-2", items.length >= 3 && "lg:grid-cols-3")}>
              {items.map((a) => (
                <Story key={a.id} a={a} actions={actions} variant={bubble ? "bubble" : "card"} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ───── Colophon ───── */}
      <footer className="mt-16 text-center">
        <div className="rule-double mb-6" />
        <p className="font-serif text-lg text-cream/80 italic">
          {openedCount > 0 ? `You opened ${openedCount} ${openedCount === 1 ? "story" : "stories"} today.` : "That's the paper."} Every tap teaches tomorrow&apos;s edition.
        </p>
        <div className="no-print mt-5 flex justify-center gap-2">
          <Button variant="glass" onClick={() => router.push("/archive")}>Previous editions</Button>
          <Button asChild>
            <a href={`/api/editions/${edition.id}/pdf`} target="_blank" rel="noreferrer"><Download /> Download PDF</a>
          </Button>
        </div>
      </footer>
    </article>
  );
}

function SectionHead({ title, kicker, note, big }: { title: string; kicker: string; note?: string; big?: boolean }) {
  return (
    <div className="mb-6">
      <div className="kicker">{kicker}</div>
      <h2 className={cn("masthead mt-2 text-cream", big ? "text-3xl leading-tight sm:text-5xl" : "text-3xl sm:text-4xl")}>{title}</h2>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-4 h-px bg-gradient-to-r from-champagne/40 via-white/10 to-transparent" />
    </div>
  );
}

type Actions = Record<"open" | "like" | "dislike" | "save" | "skip" | "hideTopic", (a: ReaderArticle) => void>;

function Story({ a, actions, variant }: { a: ReaderArticle; actions: Actions; variant: "lead" | "compact" | "card" | "bubble" }) {
  if (a.skipped) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-white/10 px-5 py-4 text-sm text-muted-foreground animate-in fade-in-0">
        <span className="truncate">Skipped · {a.title}</span>
      </div>
    );
  }
  const lead = variant === "lead";
  return (
    <div
      className={cn(
        "glass glass-hover group relative flex flex-col overflow-hidden rounded-3xl",
        variant === "bubble" && "border-champagne/25 bg-gradient-to-br from-champagne/[0.07] to-transparent",
        a.opened && "opacity-85",
      )}
    >
      {a.imageUrl && (lead || variant === "card" || variant === "bubble") && (
        <div className={cn("relative overflow-hidden", lead ? "aspect-[16/9]" : "aspect-[16/8]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-950/80 via-transparent to-transparent" />
        </div>
      )}
      <div className={cn("flex flex-1 flex-col", lead ? "p-6 sm:p-8" : "p-5")}>
        <div className="flex items-center gap-2">
          <Badge variant={variant === "bubble" ? "champagne" : "default"}>{topicLabel(a.topic)}</Badge>
          {a.opened && <Badge variant="outline">Read</Badge>}
        </div>
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => actions.open(a)}
          className="mt-3 block outline-none focus-visible:underline"
        >
          <h3 className={cn("font-serif leading-snug text-cream transition-colors group-hover:text-white", lead ? "text-3xl sm:text-4xl" : "text-xl")}>
            {a.title}
            <ArrowUpRight className="ml-1 inline size-4 -translate-y-0.5 text-champagne opacity-0 transition-opacity group-hover:opacity-100" />
          </h3>
        </a>
        <div className="mt-2 text-xs text-muted-foreground">
          {a.source}
          {a.publishedAt && <TimeAgo iso={a.publishedAt} />} · {a.readMinutes} min
        </div>
        {a.summary && (
          <p className={cn("mt-3 leading-relaxed text-cream/75", lead ? "dropcap text-[1.02rem]" : "text-sm", variant === "compact" && "line-clamp-3")}>
            {a.summary}
          </p>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-champagne/85 italic">
          <Sparkles className="mt-0.5 size-3 shrink-0" /> {a.whyHere}
        </p>
        <div className="no-print mt-auto flex items-center gap-1 pt-4">
          <IconBtn label="More like this" active={a.liked} onClick={() => actions.like(a)}>
            <ThumbsUp className={cn(a.liked && "fill-current")} />
          </IconBtn>
          <IconBtn label="Less like this" active={a.disliked} onClick={() => actions.dislike(a)}>
            <ThumbsDown className={cn(a.disliked && "fill-current")} />
          </IconBtn>
          <IconBtn label={a.saved ? "Unsave" : "Save for later"} active={a.saved} onClick={() => actions.save(a)}>
            <Bookmark className={cn(a.saved && "fill-current")} />
          </IconBtn>
          <div className="ml-auto flex items-center gap-1">
            <IconBtn label="Skip" onClick={() => actions.skip(a)}>
              <X />
            </IconBtn>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-8 cursor-pointer place-items-center rounded-full text-cream/60 transition hover:bg-white/10 hover:text-cream" aria-label="More">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => actions.hideTopic(a)}>
                  <EyeOff /> Stop showing {topicLabel(a.topic)}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={a.url} target="_blank" rel="noreferrer" onClick={() => actions.open(a)}>
                    <ArrowUpRight /> Open at {a.source}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-full transition-all duration-300 active:scale-90 [&_svg]:size-4",
        active ? "bg-wine-500/50 text-champagne" : "text-cream/60 hover:bg-white/10 hover:text-cream",
      )}
    >
      {children}
    </button>
  );
}
