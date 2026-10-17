import "server-only";
import type { Candidate } from "./sources";
import { topicLabel } from "@/lib/topics";

/**
 * Offline sample stories, used ONLY when MORROW_FIXTURES=1 and the live feeds
 * can't be reached (e.g. local development without internet). Clearly labelled.
 */
const ANGLES = [
  ["A closer look at what changed in", "Researchers and practitioners weigh in on the week's most discussed development, and what it could mean next."],
  ["Five numbers that explain this week in", "A quick tour of the figures behind the headlines, and why each one matters more than it first appears."],
  ["The quiet shift reshaping", "Away from the headlines, a slower trend is changing how people work, decide and spend their time."],
  ["Explainer: the debate everyone is having about", "Both sides make serious points. Here is the argument, set out plainly, with what to watch for."],
  ["What a new report says about the future of", "The findings are cautious but notable, and they raise questions the field has not yet answered."],
];

export function loadFixtures(topics: string[]): Candidate[] {
  const out: Candidate[] = [];
  topics.forEach((t, ti) => {
    ANGLES.forEach(([head, body], ai) => {
      out.push({
        title: `${head} ${topicLabel(t).toLowerCase()}`,
        url: `https://example.com/sample/${t}/${ai}`,
        source: ["Sample Wire", "Demo Times", "Offline Post"][(ti + ai) % 3],
        topic: t,
        summary: `[Sample story] ${body}`,
        imageUrl: null,
        publishedAt: new Date(Date.now() - (ai * 3 + ti) * 3_600_000),
      });
    });
  });
  return out;
}
