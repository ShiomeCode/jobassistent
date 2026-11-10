// Statement matching: ranks the user's statements against a job posting and explains why.

import type { PostingSection, Requirement, Statement, Template } from "./types";
import { analyzeText, analyzeTokens } from "./text";
import { detectCompetencesInStems, type CompetenceIndex } from "./competences";
import { buildBm25Index, scoreBm25 } from "./bm25";

/** How much a word counts depending on where in the posting it appears. */
export const SECTION_WEIGHTS: Readonly<Record<PostingSection, number>> = {
  expectations: 1.5,
  tasks: 1.2,
  other: 1,
  aboutUs: 0.3,
};

/** Share of the final score that comes from word matching. The rest comes from competences. */
const WORD_SCORE_SHARE = 0.5;
const MAX_QUERY_TERM_WEIGHT = 3;
const MIN_SHARED_STEMS_FOR_COVERAGE = 2;
export const DEFAULT_SUGGESTIONS_PER_SLOT = 3;

export interface Suggestion {
  statementId: string;
  /** 0..1, where 1 is the best match among the user's statements. */
  score: number;
  matchedCompetenceIds: string[];
  /** Words from the posting that also appear in the statement, as written in the posting. */
  matchedWords: string[];
}

export interface CoverageItem {
  requirement: Requirement;
  coveringStatementIds: string[];
}

export interface Coverage {
  items: CoverageItem[];
  coveredCount: number;
  totalCount: number;
}

function statementText(statement: Statement): string {
  return [statement.text, statement.shortText ?? ""].join(" ");
}

/** Vocabulary of all simple stems, so compound words on one side can match parts on the other. */
function buildVocabulary(texts: readonly string[], index: CompetenceIndex): Set<string> {
  const vocabulary = new Set(index.vocabulary);
  texts.forEach(text => analyzeText(text).forEach(stem => vocabulary.add(stem)));
  return vocabulary;
}

/** Statement competences = the user's own tags plus competences found in the text. */
export function getStatementCompetences(statement: Statement, index: CompetenceIndex, vocabulary?: ReadonlySet<string>): string[] {
  const stems = analyzeText(statementText(statement), vocabulary ?? index.vocabulary);
  return [...new Set([...statement.tags, ...detectCompetencesInStems(stems, index)])];
}

function buildQueryWeights(requirements: readonly Requirement[], vocabulary: ReadonlySet<string>) {
  const queryWeights = new Map<string, number>();
  const surfaceByStem = new Map<string, string>();
  for (const requirement of requirements) {
    const sectionWeight = SECTION_WEIGHTS[requirement.section];
    for (const token of analyzeTokens(requirement.text, vocabulary)) {
      const newWeight = Math.min((queryWeights.get(token.stem) ?? 0) + sectionWeight, MAX_QUERY_TERM_WEIGHT);
      queryWeights.set(token.stem, newWeight);
      if (!surfaceByStem.has(token.stem)) {
        surfaceByStem.set(token.stem, token.surface);
      }
    }
  }
  return { queryWeights, surfaceByStem };
}

function buildCompetenceWeights(requirements: readonly Requirement[]): Map<string, number> {
  const competenceWeights = new Map<string, number>();
  for (const requirement of requirements) {
    for (const competenceId of requirement.competenceIds) {
      const weight = (competenceWeights.get(competenceId) ?? 0) + SECTION_WEIGHTS[requirement.section];
      competenceWeights.set(competenceId, weight);
    }
  }
  return competenceWeights;
}

function normalizeByMax(values: readonly number[]): number[] {
  const maxValue = Math.max(0, ...values);
  return values.map(value => (maxValue > 0 ? value / maxValue : 0));
}

/** Ranks all statements against the posting requirements, best match first. Statements with no match are left out. */
export function rankStatements(
  statements: readonly Statement[],
  requirements: readonly Requirement[],
  index: CompetenceIndex,
): Suggestion[] {
  if (statements.length === 0 || requirements.length === 0) {
    return [];
  }

  const vocabulary = buildVocabulary(
    [...statements.map(statementText), ...requirements.map(requirement => requirement.text)],
    index,
  );
  const { queryWeights, surfaceByStem } = buildQueryWeights(requirements, vocabulary);
  const competenceWeights = buildCompetenceWeights(requirements);

  const bm25Index = buildBm25Index(
    statements.map(statement => ({ id: statement.id, tokens: analyzeText(statementText(statement), vocabulary) })),
  );
  const wordResults = scoreBm25(bm25Index, queryWeights);

  const competenceMatches = statements.map(statement =>
    getStatementCompetences(statement, index, vocabulary).filter(competenceId => competenceWeights.has(competenceId)),
  );
  const competenceScores = competenceMatches.map(matchedIds =>
    matchedIds.reduce((sum, competenceId) => sum + (competenceWeights.get(competenceId) ?? 0), 0),
  );

  const normalizedWordScores = normalizeByMax(wordResults.map(result => result.score));
  const normalizedCompetenceScores = normalizeByMax(competenceScores);

  const suggestions = statements.map((statement, statementIndex) => {
    const wordScore = normalizedWordScores[statementIndex] ?? 0;
    const competenceScore = normalizedCompetenceScores[statementIndex] ?? 0;
    const matchedStems = wordResults[statementIndex]?.matchedTerms ?? [];
    return {
      statementId: statement.id,
      score: WORD_SCORE_SHARE * wordScore + (1 - WORD_SCORE_SHARE) * competenceScore,
      matchedCompetenceIds: competenceMatches[statementIndex] ?? [],
      matchedWords: [...new Set(matchedStems.map(stem => surfaceByStem.get(stem) ?? stem))],
    };
  });

  return suggestions
    .filter(suggestion => suggestion.score > 0)
    .sort((first, second) => second.score - first.score);
}

/**
 * Picks the best statements for each template slot, respecting the statement types the slot accepts.
 * When there are fewer matches than spots, the remaining spots are filled with unmatched statements
 * of an accepted type (score 0). Motivation and personality rarely share words with a posting,
 * but the user still needs to see them.
 */
export function getSlotSuggestions(
  template: Template,
  statements: readonly Statement[],
  rankedSuggestions: readonly Suggestion[],
  suggestionsPerSlot = DEFAULT_SUGGESTIONS_PER_SLOT,
): Record<string, Suggestion[]> {
  const rankedIds = new Set(rankedSuggestions.map(suggestion => suggestion.statementId));
  const unmatchedSuggestions: Suggestion[] = statements
    .filter(statement => !rankedIds.has(statement.id))
    .map(statement => ({ statementId: statement.id, score: 0, matchedCompetenceIds: [], matchedWords: [] }));

  const statementsById = new Map(statements.map(statement => [statement.id, statement]));
  const suggestionsBySlot: Record<string, Suggestion[]> = {};

  for (const slot of template.slots) {
    suggestionsBySlot[slot.id] = [...rankedSuggestions, ...unmatchedSuggestions]
      .filter(suggestion => {
        const statement = statementsById.get(suggestion.statementId);
        return statement !== undefined && slot.acceptedTypes.includes(statement.type);
      })
      .slice(0, suggestionsPerSlot);
  }
  return suggestionsBySlot;
}

/** Requirements worth covering: everything in expectations and tasks, plus other lines that mention a competence. */
function isCoverageRelevant(requirement: Requirement): boolean {
  if (requirement.section === "expectations" || requirement.section === "tasks") {
    return true;
  }
  return requirement.section === "other" && requirement.competenceIds.length > 0;
}

/**
 * Shows which requirements the statement bank covers.
 * A requirement counts as covered by a statement when they share a competence,
 * or share at least two words. Requirements from the "about us" section, and loose lines
 * that mention no competence, are ignored.
 */
export function computeCoverage(
  requirements: readonly Requirement[],
  statements: readonly Statement[],
  index: CompetenceIndex,
): Coverage {
  const relevantRequirements = requirements.filter(isCoverageRelevant);
  const vocabulary = buildVocabulary(
    [...statements.map(statementText), ...relevantRequirements.map(requirement => requirement.text)],
    index,
  );
  const statementProfiles = statements.map(statement => ({
    id: statement.id,
    competenceIds: new Set(getStatementCompetences(statement, index, vocabulary)),
    stems: new Set(analyzeText(statementText(statement), vocabulary)),
  }));

  const items = relevantRequirements.map(requirement => {
    const requirementStems = new Set(analyzeText(requirement.text, vocabulary));
    const coveringStatementIds = statementProfiles
      .filter(profile => {
        const sharesCompetence = requirement.competenceIds.some(competenceId => profile.competenceIds.has(competenceId));
        const sharedStemCount = [...requirementStems].filter(stem => profile.stems.has(stem)).length;
        return sharesCompetence || sharedStemCount >= MIN_SHARED_STEMS_FOR_COVERAGE;
      })
      .map(profile => profile.id);
    return { requirement, coveringStatementIds };
  });

  return {
    items,
    coveredCount: items.filter(item => item.coveringStatementIds.length > 0).length,
    totalCount: items.length,
  };
}
