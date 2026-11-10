// Competence dictionary: detects which competences a text talks about, using synonyms.

import type { Competence } from "./types";
import { analyzeText } from "./text";
import defaultCompetenceList from "../data/competences.da.json";

export const DEFAULT_COMPETENCES: readonly Competence[] = defaultCompetenceList;

interface CompetenceTerm {
  competenceId: string;
  /** All stems that must be present for the term to match. */
  stems: string[];
}

export interface CompetenceIndex {
  competences: ReadonlyMap<string, Competence>;
  terms: readonly CompetenceTerm[];
  /** Every stem used by any term. Used to split compound words. */
  vocabulary: ReadonlySet<string>;
}

export function buildCompetenceIndex(competences: readonly Competence[] = DEFAULT_COMPETENCES): CompetenceIndex {
  const terms: CompetenceTerm[] = [];
  const vocabulary = new Set<string>();

  for (const competence of competences) {
    for (const term of competence.terms) {
      const stems = analyzeText(term);
      if (stems.length === 0) {
        continue;
      }
      stems.forEach(stem => vocabulary.add(stem));
      terms.push({ competenceId: competence.id, stems });
    }
  }

  const competencesById = new Map(competences.map(competence => [competence.id, competence]));
  return { competences: competencesById, terms, vocabulary };
}

/**
 * Returns the ids of the competences found in a list of stems.
 * A multi-word term matches when all of its words are present.
 */
export function detectCompetencesInStems(stems: readonly string[], index: CompetenceIndex): string[] {
  const stemSet = new Set(stems);
  const foundIds = new Set<string>();
  for (const term of index.terms) {
    if (term.stems.every(stem => stemSet.has(stem))) {
      foundIds.add(term.competenceId);
    }
  }
  return [...foundIds];
}

/** Returns the ids of the competences mentioned in a text. */
export function detectCompetences(text: string, index: CompetenceIndex): string[] {
  return detectCompetencesInStems(analyzeText(text, index.vocabulary), index);
}

export function getCompetenceLabel(competenceId: string, index: CompetenceIndex): string {
  return index.competences.get(competenceId)?.label ?? competenceId;
}
