import { describe, expect, it } from "vitest";
import { clip, normTitle, salientWords, stripHtml } from "@/lib/text";

describe("salientWords", () => {
  it("picks proper nouns from sentence-case headlines", () => {
    expect(salientWords("Babar Azam leads Pakistan to win over England", 3)).toEqual(["azam", "pakistan", "england"]);
  });
  it("trusts only acronyms in Title Case headlines", () => {
    expect(salientWords("OpenAI And SBP Clash Over New Rules", 3)).toEqual(["openai", "sbp"]);
  });
  it("ignores generic lower-case words", () => {
    expect(salientWords("A closer look at what changed in cricket")).toEqual([]);
  });
});

describe("text helpers", () => {
  it("strips html and entities", () => {
    expect(stripHtml("<p>Tom &amp; Jerry&nbsp;<b>run</b></p>")).toBe("Tom & Jerry run");
  });
  it("clips on a word boundary", () => {
    expect(clip("the quick brown fox jumps", 12)).toBe("the quick…");
    expect(clip("short", 12)).toBe("short");
  });
  it("normalises titles for de-duplication", () => {
    expect(normTitle("  Rupee Rallies — Again! ")).toBe(normTitle("rupee rallies again"));
  });
});
