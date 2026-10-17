/** The topic catalogue shown at onboarding. Shared by client and server. */
export type Topic = {
  id: string;
  label: string;
  group: "News" | "Ideas" | "Money" | "Life" | "Play";
  emoji: string;
  /** Google News search query */
  query: string;
  /** Curated feeds with good summaries/images */
  feeds?: string[];
};

export const TOPICS: Topic[] = [
  { id: "world", label: "World", group: "News", emoji: "🌍", query: "world news", feeds: ["https://feeds.bbci.co.uk/news/world/rss.xml", "https://www.theguardian.com/world/rss"] },
  { id: "pakistan", label: "Pakistan", group: "News", emoji: "🇵🇰", query: "Pakistan", feeds: ["https://www.dawn.com/feeds/home"] },
  { id: "politics", label: "Politics", group: "News", emoji: "🏛️", query: "politics government", feeds: ["https://www.theguardian.com/politics/rss"] },
  { id: "climate", label: "Climate", group: "News", emoji: "🌱", query: "climate change environment", feeds: ["https://www.theguardian.com/environment/climate-crisis/rss"] },
  { id: "technology", label: "Technology", group: "Ideas", emoji: "💻", query: "technology", feeds: ["https://feeds.bbci.co.uk/news/technology/rss.xml", "https://feeds.arstechnica.com/arstechnica/index"] },
  { id: "ai", label: "Artificial Intelligence", group: "Ideas", emoji: "🤖", query: "artificial intelligence AI", feeds: ["https://www.theguardian.com/technology/artificialintelligenceai/rss"] },
  { id: "programming", label: "Programming", group: "Ideas", emoji: "⌨️", query: "software development programming", feeds: ["https://hnrss.org/frontpage?points=150"] },
  { id: "science", label: "Science", group: "Ideas", emoji: "🔬", query: "science research discovery", feeds: ["https://www.sciencedaily.com/rss/top/science.xml", "https://www.theguardian.com/science/rss"] },
  { id: "space", label: "Space", group: "Ideas", emoji: "🚀", query: "space NASA astronomy", feeds: ["https://www.nasa.gov/news-release/feed/"] },
  { id: "education", label: "Education", group: "Ideas", emoji: "🎓", query: "education schools teaching", feeds: ["https://www.theguardian.com/education/rss"] },
  { id: "health", label: "Health", group: "Life", emoji: "🩺", query: "health medicine", feeds: ["https://feeds.bbci.co.uk/news/health/rss.xml"] },
  { id: "business", label: "Business", group: "Money", emoji: "💼", query: "business economy", feeds: ["https://feeds.bbci.co.uk/news/business/rss.xml"] },
  { id: "markets", label: "Markets", group: "Money", emoji: "📈", query: "stock market investing" },
  { id: "startups", label: "Startups", group: "Money", emoji: "🦄", query: "startup funding venture capital", feeds: ["https://techcrunch.com/category/startups/feed/"] },
  { id: "crypto", label: "Crypto", group: "Money", emoji: "🪙", query: "bitcoin crypto" },
  { id: "energy", label: "Energy & Solar", group: "Money", emoji: "☀️", query: "solar energy renewable power" },
  { id: "culture", label: "Culture", group: "Life", emoji: "🎭", query: "culture arts", feeds: ["https://www.theguardian.com/culture/rss"] },
  { id: "books", label: "Books", group: "Life", emoji: "📚", query: "books authors literature", feeds: ["https://www.theguardian.com/books/rss"] },
  { id: "film", label: "Film & TV", group: "Life", emoji: "🎬", query: "film television streaming", feeds: ["https://www.theguardian.com/film/rss"] },
  { id: "design", label: "Design", group: "Life", emoji: "✏️", query: "design architecture", feeds: ["https://www.dezeen.com/feed/"] },
  { id: "food", label: "Food", group: "Life", emoji: "🍲", query: "food cooking restaurants", feeds: ["https://www.theguardian.com/food/rss"] },
  { id: "travel", label: "Travel", group: "Life", emoji: "✈️", query: "travel destinations", feeds: ["https://www.theguardian.com/travel/rss"] },
  { id: "cricket", label: "Cricket", group: "Play", emoji: "🏏", query: "cricket", feeds: ["https://feeds.bbci.co.uk/sport/cricket/rss.xml"] },
  { id: "football", label: "Football", group: "Play", emoji: "⚽", query: "football soccer", feeds: ["https://feeds.bbci.co.uk/sport/football/rss.xml"] },
  { id: "gaming", label: "Gaming", group: "Play", emoji: "🎮", query: "video games gaming", feeds: ["https://www.theguardian.com/games/rss"] },
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));
export const TOPIC_GROUPS = ["News", "Ideas", "Money", "Life", "Play"] as const;

export const PERSONAS = [
  { id: "builder", label: "Builder", blurb: "I make things — code, products, companies." },
  { id: "educator", label: "Educator", blurb: "I teach and want to stay ahead for my students." },
  { id: "investor", label: "Investor", blurb: "I follow money, markets and what moves them." },
  { id: "curious", label: "Generalist", blurb: "I want to understand a little about everything." },
  { id: "student", label: "Student", blurb: "I'm learning and want the essentials explained." },
  { id: "leader", label: "Leader", blurb: "I need the big picture, fast." },
] as const;

export const DEPTHS = [
  { id: "BRIEF", label: "The Brief", minutes: 5, count: 8, blurb: "Eight stories. Five minutes." },
  { id: "STANDARD", label: "The Daily", minutes: 12, count: 14, blurb: "A proper morning read." },
  { id: "DEEP", label: "The Weekender", minutes: 25, count: 22, blurb: "Coffee's hot. Take your time." },
] as const;

export const REGIONS = [
  { id: "PK", label: "Pakistan" },
  { id: "US", label: "United States" },
  { id: "GB", label: "United Kingdom" },
  { id: "IN", label: "India" },
  { id: "AE", label: "UAE" },
  { id: "CA", label: "Canada" },
  { id: "AU", label: "Australia" },
] as const;

export function topicLabel(id: string) {
  return TOPIC_BY_ID.get(id)?.label ?? id.replace(/^kw:/, "").replace(/\b\w/g, (c) => c.toUpperCase());
}
