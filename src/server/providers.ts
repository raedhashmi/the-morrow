import "server-only";
import { clip, stripHtml } from "@/lib/text";
import type { Candidate } from "./sources";

/**
 * Keyed news APIs. Each runs only when its key is set in .env, and results are
 * cached for 30 minutes per query so many readers sharing a topic cost one call.
 *
 *  - The Guardian Open Platform  GUARDIAN_API_KEY   (open-platform.theguardian.com)
 *  - GNews                       GNEWS_API_KEY      (gnews.io)
 *  - NewsAPI.org                 NEWSAPI_KEY        (newsapi.org)
 */

type Query = { topic: string; q: string };
type Provider = { name: string; enabled: () => boolean; search: (q: Query, region: string) => Promise<Candidate[]> };

const cache = new Map<string, { at: number; items: Candidate[] }>();
const TTL = 30 * 60_000;

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TheMorrow/1.0", ...headers }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[providers] ${new URL(url).hostname} ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[providers] ${new URL(url).hostname} failed: ${(err as Error).message}`);
    return null;
  }
}

const date = (s?: string | null) => {
  const d = s ? new Date(s) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const guardian: Provider = {
  name: "guardian",
  enabled: () => !!process.env.GUARDIAN_API_KEY,
  async search({ topic, q }) {
    type R = { response?: { results?: { webTitle: string; webUrl: string; webPublicationDate: string; fields?: { trailText?: string; thumbnail?: string } }[] } };
    const url =
      `https://content.guardianapis.com/search?q=${encodeURIComponent(q)}&order-by=newest&page-size=10` +
      `&show-fields=trailText,thumbnail&api-key=${process.env.GUARDIAN_API_KEY}`;
    const data = await getJson<R>(url);
    return (data?.response?.results ?? []).map((r) => ({
      title: r.webTitle,
      url: r.webUrl,
      source: "The Guardian",
      topic,
      summary: clip(stripHtml(r.fields?.trailText ?? ""), 320),
      imageUrl: r.fields?.thumbnail ?? null,
      publishedAt: date(r.webPublicationDate),
    }));
  },
};

const gnews: Provider = {
  name: "gnews",
  enabled: () => !!process.env.GNEWS_API_KEY,
  async search({ topic, q }, region) {
    type R = { articles?: { title: string; description?: string; url: string; image?: string; publishedAt?: string; source?: { name?: string } }[] };
    const country = region.toLowerCase();
    const url =
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=${country}&max=10&sortby=publishedAt` +
      `&apikey=${process.env.GNEWS_API_KEY}`;
    const data = await getJson<R>(url);
    return (data?.articles ?? []).map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name || "GNews",
      topic,
      summary: clip(stripHtml(a.description ?? ""), 320),
      imageUrl: a.image ?? null,
      publishedAt: date(a.publishedAt),
    }));
  },
};

const newsapi: Provider = {
  name: "newsapi",
  enabled: () => !!process.env.NEWSAPI_KEY,
  async search({ topic, q }) {
    type R = { articles?: { title: string; description?: string; url: string; urlToImage?: string; publishedAt?: string; source?: { name?: string } }[] };
    const from = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${from}&language=en&sortBy=publishedAt&pageSize=15`;
    const data = await getJson<R>(url, { "X-Api-Key": process.env.NEWSAPI_KEY! });
    return (data?.articles ?? [])
      .filter((a) => a.title && a.title !== "[Removed]")
      .map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source?.name || "NewsAPI",
        topic,
        summary: clip(stripHtml(a.description ?? ""), 320),
        imageUrl: a.urlToImage ?? null,
        publishedAt: date(a.publishedAt),
      }));
  },
};

export const PROVIDERS = [guardian, gnews, newsapi];

export function activeProviders() {
  return PROVIDERS.filter((p) => p.enabled()).map((p) => p.name);
}

/** Query every enabled provider for every topic / keyword / city. */
export async function fetchProviders(opts: {
  topics: { id: string; query: string }[];
  keywords: string[];
  region: string;
  city?: string | null;
}): Promise<Candidate[]> {
  const enabled = PROVIDERS.filter((p) => p.enabled());
  if (!enabled.length) return [];
  const queries: Query[] = [
    ...opts.topics.map((t) => ({ topic: t.id, q: t.query })),
    ...opts.keywords.map((k) => ({ topic: `kw:${k}`, q: `"${k}"` })),
    ...(opts.city ? [{ topic: "local", q: opts.city }] : []),
  ];
  const jobs = enabled.flatMap((p) =>
    queries.map(async (q) => {
      const key = `${p.name}|${opts.region}|${q.q}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < TTL) return hit.items.map((c) => ({ ...c, topic: q.topic }));
      const items = (await p.search(q, opts.region)).filter((c) => c.title && c.url);
      cache.set(key, { at: Date.now(), items });
      return items;
    }),
  );
  const settled = await Promise.allSettled(jobs);
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
