import { describe, expect, it } from "vitest";
import { buildLetter, composeApplicationText, DEFAULT_TEMPLATE, findHighlightRanges, formatLetterAsText, stemWord } from "../src";
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

describe("buildLetter and formatLetterAsText", () => {
  const paragraphs = ["Jeg søger stillingen.", "Jeg har erfaring med React."];

  it("puts sender, date, heading, body and signature in order", () => {
    const letter = buildLetter({
      profile: { name: "René Hansen", email: "rene@example.com", phone: " ", address: "Vejen 1, 8000 Aarhus" },
      heading: " Ansøgning: Frontendudvikler ",
      paragraphs,
      dateLine: "11. november 2026",
      signOff: "Med venlig hilsen",
    });

    expect(letter.senderLines).toEqual(["René Hansen", "Vejen 1, 8000 Aarhus", "rene@example.com"]);
    expect(formatLetterAsText(letter)).toBe(
      [
        "René Hansen\nVejen 1, 8000 Aarhus\nrene@example.com",
        "11. november 2026",
        "Ansøgning: Frontendudvikler",
        "Jeg søger stillingen.",
        "Jeg har erfaring med React.",
        "Med venlig hilsen\nRené Hansen",
      ].join("\n\n"),
    );
  });

  it("works without a profile", () => {
    const letter = buildLetter({ heading: "", paragraphs, dateLine: "1. maj 2026", signOff: "Med venlig hilsen" });
    expect(formatLetterAsText(letter)).toBe(
      ["1. maj 2026", "Jeg søger stillingen.", "Jeg har erfaring med React.", "Med venlig hilsen"].join("\n\n"),
    );
  });
});

describe("edited statement texts", () => {
  it("uses the application's own version of a statement when it was edited", () => {
    const text = composeApplicationText(
      DEFAULT_TEMPLATE,
      { evidence: { statementIds: ["react", "stakeholders"], editedTexts: { react: "Min egen version." } } },
      SAMPLE_STATEMENTS,
    );
    expect(text).toBe(`Min egen version. ${SAMPLE_STATEMENTS[1]!.text}`);
  });
});
