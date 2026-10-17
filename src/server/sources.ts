import "server-only";
import Parser from "rss-parser";

export type Candidate = {
  title: string;
  url: string;
  source: string;
  topic: string; // topic id, or keyword label for custom interests
  summary: string;
  imageUrl: string | null;
  publishedAt: Date | null;
};

type Item = Parser.Item & {
  source?: string | { _: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
  "content:encoded"?: string;
};

const parser: Parser<object, Item> = new Parser({
  timeout: 7000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TheMorrowBot/1.0; +https://themorrow.app)" },
  customFields: { item: ["source", "media:content", "media:thumbnail", "content:encoded"] },
});

// Small in-memory cache so many readers sharing a topic don't refetch the same feed.
const cache = new Map<string, { at: number; items: Item[]; title: string }>();
const TTL = 20 * 60_000;

async function fetchFeed(url: string) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit;
  try {
    const feed = await parser.parseURL(url);
    const entry = { at: Date.now(), items: feed.items ?? [], title: feed.title ?? "" };
    cache.set(url, entry);
    return entry;
  } catch (err) {
    console.warn(`[sources] ${url} failed: ${(err as Error).message}`);
    return { at: Date.now(), items: [] as Item[], title: "" };
  }
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

function clip(s: string, n: number) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

function prettySource(feedTitle: string, url: string) {
  const t = feedTitle.replace(/\s*[-|:].*$/, "").trim();
  if (t && t.length < 40) return t;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "The Web";
  }
}

function toCandidate(item: Item, topic: string, feedTitle: string, fromGoogle: boolean): Candidate | null {
  if (!item.title || !item.link) return null;
  let title = stripHtml(item.title);
  let source = "";
  if (fromGoogle) {
    // Google News titles look like "Headline - Publisher"
    const src = typeof item.source === "string" ? item.source : item.source?._;
    const idx = title.lastIndexOf(" - ");
    if (idx > 0) {
      source = src || title.slice(idx + 3);
      title = title.slice(0, idx);
    }
    source ||= src || "Google News";
  } else {
    source = prettySource(feedTitle, item.link);
  }
  const rawSummary = fromGoogle ? "" : stripHtml(item.contentSnippet || item.content || item["content:encoded"] || "");
  const image =
    item["media:content"]?.$?.url ||
    item["media:thumbnail"]?.$?.url ||
    (item.enclosure?.type?.startsWith("image") ? item.enclosure.url : undefined) ||
    null;
  const published = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null;
  return {
    title,
    url: item.link,
    source,
    topic,
    summary: clip(rawSummary.replace(/Continue reading\.*$/i, "").replace(/Article URL:[\s\S]*$/, "").trim(), 320),
    imageUrl: image,
    publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
  };
}

function googleNewsUrl(query: string, region: string) {
  const hl = region === "PK" || region === "IN" ? `en-${region}` : region === "GB" ? "en-GB" : "en-US";
  const q = encodeURIComponent(`${query} when:2d`);
  return `https://news.google.com/rss/search?q=${q}&hl=${hl}&gl=${region}&ceid=${region}:en`;
}

/** Gather candidates for a set of topics and free-text keywords. */
export async function gather(opts: {
  topics: { id: string; query: string; feeds?: string[] }[];
  keywords: string[];
  region: string;
  city?: string | null;
}): Promise<Candidate[]> {
  const jobs: Promise<Candidate[]>[] = [];

  for (const t of opts.topics) {
    for (const f of t.feeds ?? []) {
      jobs.push(
        fetchFeed(f).then(({ items, title }) =>
          items.slice(0, 15).map((i) => toCandidate(i, t.id, title, false)).filter((c): c is Candidate => !!c),
        ),
      );
    }
    jobs.push(
      fetchFeed(googleNewsUrl(t.query, opts.region)).then(({ items }) =>
        items.slice(0, 12).map((i) => toCandidate(i, t.id, "", true)).filter((c): c is Candidate => !!c),
      ),
    );
  }
  for (const k of opts.keywords) {
    jobs.push(
      fetchFeed(googleNewsUrl(`"${k}"`, opts.region)).then(({ items }) =>
        items.slice(0, 10).map((i) => toCandidate(i, `kw:${k}`, "", true)).filter((c): c is Candidate => !!c),
      ),
    );
  }
  if (opts.city) {
    jobs.push(
      fetchFeed(googleNewsUrl(opts.city, opts.region)).then(({ items }) =>
        items.slice(0, 8).map((i) => toCandidate(i, "local", "", true)).filter((c): c is Candidate => !!c),
      ),
    );
  }

  const settled = await Promise.allSettled(jobs);
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
