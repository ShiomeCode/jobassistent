import { describe, expect, it } from "vitest";
import { analyzeText, splitCompound, stemWord, tokenize } from "../src";

describe("tokenize", () => {
  it("lower-cases and splits on punctuation and hyphens", () => {
    expect(tokenize("Erfaring med IT-support, Excel.")).toEqual(["erfaring", "med", "it", "support", "excel"]);
  });

  it("keeps tech names with symbols", () => {
    expect(tokenize("C#, C++ og .NET")).toEqual(["c#", "c++", "og", "dotnet"]);
  });
});

describe("stemWord", () => {
  it("gives inflected forms the same stem", () => {
    expect(stemWord("erfaringer")).toBe(stemWord("erfaring"));
    expect(stemWord("samarbejder")).toBe(stemWord("samarbejde"));
  });

  it("leaves words with symbols untouched", () => {
    expect(stemWord("c#")).toBe("c#");
  });
});

describe("splitCompound", () => {
  it("splits a compound when the tail is known", () => {
    const vocabulary = new Set([stemWord("ledelse"), "projekt"]);
    expect(splitCompound(stemWord("projektledelse"), vocabulary)).toEqual(["projekt", stemWord("ledelse")]);
  });

  it("removes a linking letter from the head", () => {
    const vocabulary = new Set([stemWord("ledelse"), stemWord("erfaring")]);
    expect(splitCompound(stemWord("ledelseserfaring"), vocabulary)).toEqual([stemWord("ledelse"), stemWord("erfaring")]);
  });

  it("returns nothing when no part is known", () => {
    expect(splitCompound("surdejsbrød", new Set(["kode"]))).toEqual([]);
  });
});

describe("analyzeText", () => {
  it("removes stop words", () => {
    expect(analyzeText("jeg har og med")).toEqual([]);
  });

  it("adds compound parts as extra tokens", () => {
    const vocabulary = new Set([stemWord("ledelse")]);
    expect(analyzeText("personaleledelse", vocabulary)).toContain(stemWord("ledelse"));
  });
});
