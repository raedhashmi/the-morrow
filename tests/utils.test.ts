import { describe, expect, it } from "vitest";
import { hourIn, hourLabel, longDate, todayIn } from "@/lib/utils";
import { DEPTHS, TOPICS, TOPIC_BY_ID, topicLabel } from "@/lib/topics";

describe("dates", () => {
  it("formats long dates identically on server and client", () => {
    expect(longDate("2026-10-17")).toBe("Saturday, 17 October 2026");
    expect(longDate("2024-02-29")).toBe("Thursday, 29 February 2024");
  });
  it("computes today and hour in a reader's timezone", () => {
    const at = new Date("2026-10-17T20:30:00Z");
    expect(todayIn("Asia/Karachi", at)).toBe("2026-10-18");
    expect(todayIn("America/New_York", at)).toBe("2026-10-17");
    expect(hourIn("Asia/Karachi", at)).toBe(1);
  });
  it("labels hours without locale", () => {
    expect(hourLabel(0)).toBe("12 AM");
    expect(hourLabel(7)).toBe("7 AM");
    expect(hourLabel(13)).toBe("1 PM");
  });
});

describe("topic catalogue", () => {
  it("has unique ids and labels", () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    expect(TOPIC_BY_ID.get("ai")?.label).toBe("Artificial Intelligence");
  });
  it("labels custom keywords nicely", () => {
    expect(topicLabel("kw:solar inverters")).toBe("Solar Inverters");
  });
  it("orders depths from short to long", () => {
    expect(DEPTHS.map((d) => d.count)).toEqual([...DEPTHS.map((d) => d.count)].sort((a, b) => a - b));
  });
});
