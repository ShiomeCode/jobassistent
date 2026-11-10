import { describe, expect, it } from "vitest";
import {
  buildCompetenceIndex,
  computeCoverage,
  DEFAULT_TEMPLATE,
  extractRequirements,
  getSlotSuggestions,
  rankStatements,
} from "../src";
import { SAMPLE_POSTING, SAMPLE_STATEMENTS } from "./fixtures";

const index = buildCompetenceIndex();
const requirements = extractRequirements(SAMPLE_POSTING, index);

describe("rankStatements", () => {
  const ranked = rankStatements(SAMPLE_STATEMENTS, requirements, index);
  const rankedIds = ranked.map(suggestion => suggestion.statementId);

  it("puts the most relevant statement first", () => {
    expect(rankedIds[0]).toBe("react");
    expect(ranked[0]?.score).toBe(1);
  });

  it("matches through synonyms, not just identical words", () => {
    const stakeholderSuggestion = ranked.find(suggestion => suggestion.statementId === "stakeholders");
    expect(stakeholderSuggestion?.matchedCompetenceIds).toContain("stakeholder-management");

    const structureSuggestion = ranked.find(suggestion => suggestion.statementId === "structure");
    expect(structureSuggestion?.matchedCompetenceIds).toContain("structure");
  });

  it("leaves out irrelevant statements", () => {
    expect(rankedIds).not.toContain("baking");
  });

  it("explains matches with words from the posting", () => {
    expect(ranked[0]?.matchedWords).toEqual(expect.arrayContaining(["react", "typescript"]));
  });

  it("uses the user's own tags", () => {
    const taggedBaking = { ...SAMPLE_STATEMENTS[3]!, tags: ["collaboration"] };
    const rankedWithTag = rankStatements([taggedBaking], requirements, index);
    expect(rankedWithTag[0]?.matchedCompetenceIds).toContain("collaboration");
  });

  it("returns nothing for an empty bank or posting", () => {
    expect(rankStatements([], requirements, index)).toEqual([]);
    expect(rankStatements(SAMPLE_STATEMENTS, [], index)).toEqual([]);
  });
});

describe("getSlotSuggestions", () => {
  it("only suggests statement types the slot accepts", () => {
    const ranked = rankStatements(SAMPLE_STATEMENTS, requirements, index);
    const bySlot = getSlotSuggestions(DEFAULT_TEMPLATE, SAMPLE_STATEMENTS, ranked);

    expect(bySlot.evidence?.map(suggestion => suggestion.statementId)).toEqual(
      expect.arrayContaining(["react", "stakeholders"]),
    );
    expect(bySlot.personality?.map(suggestion => suggestion.statementId)).toEqual(["structure"]);
    expect(bySlot.opening).toEqual([]);
  });

  it("fills empty spots with unmatched statements of the right type, after the matches", () => {
    const ranked = rankStatements(SAMPLE_STATEMENTS, requirements, index);
    const bySlot = getSlotSuggestions(DEFAULT_TEMPLATE, SAMPLE_STATEMENTS, ranked);

    expect(bySlot.motivation).toEqual([
      { statementId: "motivation", score: 0, matchedCompetenceIds: [], matchedWords: [] },
    ]);
    const evidenceScores = bySlot.evidence?.map(suggestion => suggestion.score) ?? [];
    expect(evidenceScores).toEqual([...evidenceScores].sort((first, second) => second - first));
  });
});

describe("computeCoverage", () => {
  it("counts covered requirements and ignores the about-us section", () => {
    const coverage = computeCoverage(requirements, SAMPLE_STATEMENTS, index);
    expect(coverage.items.every(item => item.requirement.section !== "aboutUs")).toBe(true);
    expect(coverage.coveredCount).toBeGreaterThan(0);
    expect(coverage.coveredCount).toBeLessThanOrEqual(coverage.totalCount);

    const structureItem = coverage.items.find(item => item.requirement.text.includes("struktureret"));
    expect(structureItem?.coveringStatementIds).toContain("structure");
  });

  it("ignores loose lines without competences, such as a company name", () => {
    const postingWithLooseLine = `Fiktivt Firma A/S søger\n\nVi forventer:\n- Erfaring med React`;
    const looseRequirements = extractRequirements(postingWithLooseLine, index);
    const coverage = computeCoverage(looseRequirements, SAMPLE_STATEMENTS, index);
    expect(coverage.items.map(item => item.requirement.text)).toEqual(["Erfaring med React"]);
  });
});
