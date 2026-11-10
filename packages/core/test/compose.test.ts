import { describe, expect, it } from "vitest";
import { composeApplicationText, DEFAULT_TEMPLATE, findHighlightRanges, stemWord } from "../src";
import { SAMPLE_STATEMENTS } from "./fixtures";

describe("composeApplicationText", () => {
  it("writes one paragraph per filled slot, free text first", () => {
    const text = composeApplicationText(
      DEFAULT_TEMPLATE,
      {
        opening: { statementIds: [], freeText: "Jeg søger stillingen som frontendudvikler." },
        evidence: { statementIds: ["react", "stakeholders"] },
        personality: { statementIds: [] },
        closing: { statementIds: [], freeText: "  Jeg ser frem til at høre fra jer.  " },
      },
      SAMPLE_STATEMENTS,
    );

    expect(text.split("\n\n")).toEqual([
      "Jeg søger stillingen som frontendudvikler.",
      `${SAMPLE_STATEMENTS[0]!.text} ${SAMPLE_STATEMENTS[1]!.text}`,
      "Jeg ser frem til at høre fra jer.",
    ]);
  });

  it("ignores statements that no longer exist", () => {
    const text = composeApplicationText(DEFAULT_TEMPLATE, { evidence: { statementIds: ["deleted"] } }, SAMPLE_STATEMENTS);
    expect(text).toBe("");
  });
});

describe("findHighlightRanges", () => {
  it("returns ranges of words with a matching stem, including inflections", () => {
    const text = "Du har erfaringer med React.";
    const ranges = findHighlightRanges(text, new Set([stemWord("erfaring"), "react"]));
    expect(ranges.map(range => text.slice(range.start, range.end))).toEqual(["erfaringer", "React"]);
  });

  it("highlights compound words when a part matches", () => {
    const text = "Erfaring med personaleledelse";
    const ledelseStem = stemWord("ledelse");
    const ranges = findHighlightRanges(text, new Set([ledelseStem]), new Set([ledelseStem]));
    expect(ranges.map(range => text.slice(range.start, range.end))).toEqual(["personaleledelse"]);
  });
});
