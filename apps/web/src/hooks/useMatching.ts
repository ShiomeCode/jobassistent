// Runs the matching engine on a job posting. Everything is computed locally and memoized.

import { useMemo } from "react";
import {
  analyzeText,
  computeCoverage,
  extractRequirements,
  findHighlightRanges,
  getSlotSuggestions,
  getStatementCompetences,
  rankStatements,
  type Coverage,
  type Requirement,
  type Statement,
  type Suggestion,
  type Template,
  type TextRange,
} from "@jobassistent/core";
import { competenceIndex } from "../competenceIndex";

export interface MatchingResult {
  requirements: Requirement[];
  suggestionsBySlot: Record<string, Suggestion[]>;
  coverage: Coverage;
  highlightRanges: TextRange[];
}

/** Stems worth highlighting in the posting: words from the bank plus synonyms of the bank's competences. */
function buildHighlightStems(statements: readonly Statement[], vocabulary: ReadonlySet<string>): Set<string> {
  const highlightStems = new Set<string>();
  const bankCompetenceIds = new Set<string>();
  for (const statement of statements) {
    analyzeText(`${statement.text} ${statement.shortText ?? ""}`, vocabulary).forEach(stem => highlightStems.add(stem));
    getStatementCompetences(statement, competenceIndex, vocabulary).forEach(competenceId => bankCompetenceIds.add(competenceId));
  }
  for (const term of competenceIndex.terms) {
    if (bankCompetenceIds.has(term.competenceId)) {
      term.stems.forEach(stem => highlightStems.add(stem));
    }
  }
  return highlightStems;
}

// Used on page: ApplicationPage
export function useMatching(postingText: string, statements: readonly Statement[], template: Template): MatchingResult | undefined {
  return useMemo(() => {
    if (postingText.trim().length === 0) {
      return undefined;
    }
    const requirements = extractRequirements(postingText, competenceIndex);
    const rankedSuggestions = rankStatements(statements, requirements, competenceIndex);

    const vocabulary = new Set(competenceIndex.vocabulary);
    [postingText, ...statements.map(statement => statement.text)].forEach(text =>
      analyzeText(text).forEach(stem => vocabulary.add(stem)),
    );

    return {
      requirements,
      suggestionsBySlot: getSlotSuggestions(template, statements, rankedSuggestions),
      coverage: computeCoverage(requirements, statements, competenceIndex),
      highlightRanges: findHighlightRanges(postingText, buildHighlightStems(statements, vocabulary), vocabulary),
    };
  }, [postingText, statements, template]);
}
