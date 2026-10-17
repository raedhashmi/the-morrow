import "server-only";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

// Newspapers hyphenate, but mid-word breaks in headlines look wrong — keep words whole.
Font.registerHyphenationCallback((word) => [word]);
import { longDate } from "@/lib/utils";
import { topicLabel } from "@/lib/topics";

type A = {
  id: string;
  section: string;
  isLead: boolean;
  serendipity: boolean;
  title: string;
  url: string;
  source: string;
  topic: string;
  summary: string;
  whyHere: string;
  imageUrl: string | null;
  readMinutes: number;
  score: number;
};

export type PdfEdition = {
  number: number;
  date: string;
  headline: string;
  editorNote: string;
  readerName: string;
  city: string | null;
  takeaways: { articleId: string; point: string }[];
  articles: A[];
};

const INK = "#1b1013";
const WINE = "#7a1a37";
const MUTE = "#6b5a5e";
const RULE = "#2a1a1e";

// Built-in PDF fonts only cover Latin-1 well; keep text safe and readable.
function clean(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 42, paddingHorizontal: 34, backgroundColor: "#fbf6ee", color: INK, fontFamily: "Times-Roman" },
  topline: { flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, fontFamily: "Helvetica", letterSpacing: 1.2, color: MUTE, textTransform: "uppercase" },
  mast: { fontFamily: "Times-Bold", fontSize: 64, textAlign: "center", letterSpacing: -1.5, color: INK, marginTop: 4 },
  tagline: { fontFamily: "Times-Italic", fontSize: 10, textAlign: "center", color: WINE, marginTop: -2 },
  rule: { borderTopWidth: 0.6, borderTopColor: RULE },
  ruleThick: { borderTopWidth: 2.2, borderTopColor: RULE },
  dateline: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, paddingVertical: 4, textTransform: "uppercase" },
  banner: { fontFamily: "Times-Bold", fontSize: 30, lineHeight: 1.05, textAlign: "center", marginTop: 10, marginBottom: 8 },
  row: { flexDirection: "row" },
  colGap: { width: 12 },
  vrule: { width: 0.6, backgroundColor: "#bfb2b4", marginHorizontal: 8 },
  kicker: { fontFamily: "Helvetica-Bold", fontSize: 6.8, letterSpacing: 1.3, color: WINE, textTransform: "uppercase", marginBottom: 3 },
  leadTitle: { fontFamily: "Times-Bold", fontSize: 21, lineHeight: 1.08, marginBottom: 5 },
  title: { fontFamily: "Times-Bold", fontSize: 12.5, lineHeight: 1.12, marginBottom: 3 },
  byline: { fontFamily: "Helvetica", fontSize: 6.8, color: MUTE, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  body: { fontSize: 9.4, lineHeight: 1.38, textAlign: "justify" },
  why: { fontFamily: "Times-Italic", fontSize: 8, color: WINE, marginTop: 3 },
  link: { fontFamily: "Helvetica", fontSize: 6.6, color: MUTE, marginTop: 3, textDecoration: "none" },
  story: { marginBottom: 11, paddingBottom: 9, borderBottomWidth: 0.5, borderBottomColor: "#cfc3c4" },
  box: { borderWidth: 1, borderColor: RULE, padding: 9, marginBottom: 10 },
  boxTitle: { fontFamily: "Times-Bold", fontSize: 12, marginBottom: 5, textAlign: "center" },
  sectionHead: { flexDirection: "row", alignItems: "center", marginTop: 6, marginBottom: 8 },
  sectionTitle: { fontFamily: "Times-Bold", fontSize: 20, marginHorizontal: 8 },
  footer: { position: "absolute", bottom: 18, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 7, fontFamily: "Helvetica", color: MUTE, borderTopWidth: 0.5, borderTopColor: "#bfb2b4", paddingTop: 5 },
  image: { width: "100%", height: 170, objectFit: "cover", marginBottom: 6 },
});

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function Story({ a, lead = false, image }: { a: A; lead?: boolean; image?: Buffer | null }) {
  const leadTitle = lead ? [s.leadTitle, { fontSize: a.title.length < 70 ? 26 : 21 }] : s.title;
  return (
    <View style={s.story} wrap={false}>
      <Text style={s.kicker}>{clean(topicLabel(a.topic))}{a.serendipity ? "  -  Beyond your bubble" : ""}</Text>
      {lead && image ? <Image src={image} style={s.image} /> : null}
      <Link src={a.url} style={{ textDecoration: "none", color: INK }}>
        <Text style={leadTitle}>{clean(a.title)}</Text>
      </Link>
      <Text style={s.byline}>{clean(a.source)}  -  {a.readMinutes} min read</Text>
      {a.summary ? <Text style={[s.body, lead ? { fontSize: 10.5 } : {}]}>{clean(a.summary)}</Text> : null}
      <Text style={s.why}>{clean(a.whyHere)}</Text>
      <Link src={a.url} style={s.link}>Read in full: {host(a.url)}</Link>
    </View>
  );
}

function Columns({ items, cols = 3 }: { items: A[]; cols?: number }) {
  // Lay stories out in unbreakable rows so a story never splits across pages.
  const rows: A[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  const width = (527 - (cols - 1) * 17) / cols;
  return (
    <View>
      {rows.map((row, r) => (
        <View key={r} style={s.row} wrap={false}>
          {row.map((a, i) => (
            <View key={a.id} style={s.row}>
              {i > 0 && <View style={s.vrule} />}
              <View style={{ width }}>
                <Story a={a} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PaperDoc({ e, leadImage }: { e: PdfEdition; leadImage: Buffer | null }) {
  const front = e.articles.filter((a) => a.section === "Front Page");
  const lead = front.find((a) => a.isLead) ?? front[0];
  const secondary = front.filter((a) => a !== lead);
  const best = new Map<string, number>();
  for (const a of e.articles) if (a.section !== "Front Page") best.set(a.section, Math.max(best.get(a.section) ?? -Infinity, a.score));
  const sections = [...best.keys()].sort(
    (x, y) => Number(x === "Beyond Your Bubble") - Number(y === "Beyond Your Bubble") || best.get(y)! - best.get(x)!,
  );
  const showBanner = !lead || clean(e.headline) !== clean(lead.title);
  const byId = new Map(e.articles.map((a) => [a.id, a]));

  return (
    <Document title={`The Morrow - ${longDate(e.date)}`} author="The Morrow" subject={clean(e.headline)}>
      <Page size="A4" style={s.page}>
        <View style={s.topline}>
          <Text>No. {e.number}</Text>
          <Text>A personal newspaper for {clean(e.readerName)}</Text>
          <Text>{e.city ? `${clean(e.city)} edition` : "Personal edition"}</Text>
        </View>
        <Text style={s.mast}>The Morrow</Text>
        <Text style={s.tagline}>Your morning, considered.</Text>
        <View style={[s.ruleThick, { marginTop: 8 }]} />
        <View style={s.dateline}>
          <Text>{longDate(e.date)}</Text>
          <Text>{e.articles.length} stories  -  {new Set(e.articles.map((a) => a.source)).size} sources</Text>
        </View>
        <View style={s.rule} />
        {showBanner ? (
          <>
            <Text style={s.banner}>{clean(e.headline)}</Text>
            <View style={[s.rule, { marginBottom: 10 }]} />
          </>
        ) : (
          <View style={{ marginBottom: 10 }} />
        )}

        <View style={s.row}>
          <View style={{ width: 340 }}>{lead && <Story a={lead} lead image={leadImage} />}</View>
          <View style={s.vrule} />
          <View style={{ width: 170 }}>
            <View style={s.box}>
              <Text style={s.boxTitle}>From the Editor</Text>
              <Text style={[s.body, { fontFamily: "Times-Italic", fontSize: 9 }]}>{clean(e.editorNote)}</Text>
            </View>
            {e.takeaways.length > 0 && (
              <View style={[s.box, { backgroundColor: "#f3e6dc" }]}>
                <Text style={s.boxTitle}>Three Things to Remember</Text>
                {e.takeaways.map((t, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
                    <Text style={{ fontFamily: "Times-Bold", fontSize: 14, color: WINE, width: 14 }}>{i + 1}</Text>
                    <Text style={[s.body, { flex: 1, fontSize: 8.8, textAlign: "left" }]}>{clean(t.point || byId.get(t.articleId)?.title || "")}</Text>
                  </View>
                ))}
              </View>
            )}
            {secondary.slice(0, 1).map((a) => (
              <Story key={a.id} a={a} />
            ))}
          </View>
        </View>
        {secondary.length > 1 && (
          <>
            <View style={[s.ruleThick, { marginBottom: 8 }]} />
            <Columns items={secondary.slice(1)} cols={secondary.length - 1 >= 3 ? 3 : 2} />
          </>
        )}

        {sections.map((sec, si) => {
          const items = e.articles.filter((a) => a.section === sec);
          const cols = items.length >= 3 ? 3 : items.length === 2 ? 2 : 1;
          return (
            <View key={sec} break={si === 0}>
              {/* Header travels with its first row, so it is never orphaned at a page bottom. */}
              <View wrap={false}>
                <View style={s.sectionHead}>
                  <View style={[s.ruleThick, { flex: 1 }]} />
                  <Text style={s.sectionTitle}>{clean(sec)}</Text>
                  <View style={[s.ruleThick, { flex: 1 }]} />
                </View>
                <Columns items={items.slice(0, cols)} cols={cols} />
              </View>
              {items.length > cols && <Columns items={items.slice(cols)} cols={cols} />}
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text>The Morrow  -  No. {e.number}  -  {longDate(e.date)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

async function fetchImage(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !/image\/(jpe?g|png)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length < 4_000_000 ? buf : null;
  } catch {
    return null;
  }
}

export async function renderEditionPdf(e: PdfEdition) {
  const lead = e.articles.find((a) => a.isLead);
  const leadImage = await fetchImage(lead?.imageUrl ?? null);
  return renderToBuffer(<PaperDoc e={e} leadImage={leadImage} />);
}
