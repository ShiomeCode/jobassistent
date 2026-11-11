// CV import: finds sentences in a CV that could become statements, and guesses their type.
// The user always reviews the candidates before anything is added to the bank.

import type { StatementType } from "./types";
import { detectCompetences, type CompetenceIndex } from "./competences";
import { BULLET_PATTERN, SENTENCE_SPLIT_PATTERN } from "./posting";

export interface StatementCandidate {
  id: string;
  text: string;
  suggestedType: StatementType;
  competenceIds: string[];
}

const MIN_CANDIDATE_LENGTH = 25;
const MAX_CANDIDATE_LENGTH = 300;
const MIN_CANDIDATE_WORDS = 4;

/** Lines that are contact details, links or dates rather than statements about the person. */
const NOISE_PATTERNS: readonly RegExp[] = [
  /@/,
  /https?:\/\/|www\./i,
  /(?:\+45\s?)?\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/,
  /^\s*(?:\d{1,2}[./-])?\d{4}\s*[-–]\s*(?:(?:\d{1,2}[./-])?\d{4}|nu|i dag|present)\b/i,
];

// Signals are checked in this order: motivation, result, personality. Anything else is a skill.
const MOTIVATION_SIGNALS = /\b(?:brænder for|motiveret|motiverer|motivation|drømmer|passion|glæder mig|drives af|interesse for|ønsker at)\b/i;
const RESULT_SIGNALS =
  /\d+\s?%|\b\d+(?:[.,]\d+)?\s?(?:mio|millioner|kr|timer|dage|procent|kunder|medarbejdere)\b|\b(?:øgede|reducerede|halverede|fordoblede|forbedrede|sparede|opnåede|indførte|implementerede|lancerede|byggede|udviklede|etablerede|vandt|leverede|gennemførte|effektiviserede)\b/i;
const PERSONALITY_SIGNALS =
  /\b(?:jeg er (?:en )?|beskriver mig|mine kolleger|personlig|rolig|positiv|nysgerrig|ansvarsbevidst|mødestabil|humør|empatisk|udadvendt|pligtopfyldende)\b/i;

export function guessStatementType(text: string): StatementType {
  if (MOTIVATION_SIGNALS.test(text)) {
    return "motivation";
  }
  if (RESULT_SIGNALS.test(text)) {
    return "result";
  }
  if (PERSONALITY_SIGNALS.test(text)) {
    return "personality";
  }
  return "skill";
}

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(text));
}

function isMostlyUpperCase(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, "");
  return letters.length > 0 && letters === letters.toUpperCase();
}

function isCandidateText(text: string): boolean {
  const wordCount = text.split(/\s+/).length;
  return (
    text.length >= MIN_CANDIDATE_LENGTH &&
    text.length <= MAX_CANDIDATE_LENGTH &&
    wordCount >= MIN_CANDIDATE_WORDS &&
    !isNoise(text) &&
    !isMostlyUpperCase(text)
  );
}

/**
 * Joins lines that were broken in the middle of a sentence, which is common in text copied from PDFs.
 * A line is joined with the next one when it does not end a sentence and the next line starts in lower case.
 * Bullet lines always start a new block.
 */
function joinBrokenLines(lines: readonly string[]): string[] {
  const blocks: string[] = [];
  for (const line of lines) {
    const previousBlock = blocks.at(-1);
    const continuesPrevious =
      previousBlock !== undefined &&
      !BULLET_PATTERN.test(line) &&
      !/[.!?:]$/.test(previousBlock) &&
      /^\p{Ll}/u.test(line);
    if (continuesPrevious) {
      blocks[blocks.length - 1] = `${previousBlock} ${line}`;
    } else {
      blocks.push(line);
    }
  }
  return blocks;
}

/** Splits CV text into sentences that could be statements, with a suggested type and competences. */
export function extractStatementCandidates(cvText: string, index: CompetenceIndex): StatementCandidate[] {
  const lines = cvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const seenTexts = new Set<string>();
  const candidates: StatementCandidate[] = [];

  for (const block of joinBrokenLines(lines)) {
    const sentences = BULLET_PATTERN.test(block)
      ? [block.replace(BULLET_PATTERN, "")]
      : block.split(SENTENCE_SPLIT_PATTERN);

    for (const sentence of sentences) {
      const text = sentence.trim().replace(/\s+/g, " ");
      const normalizedText = text.toLowerCase();
      if (!isCandidateText(text) || seenTexts.has(normalizedText)) {
        continue;
      }
      seenTexts.add(normalizedText);
      candidates.push({
        id: `candidate-${candidates.length + 1}`,
        text,
        suggestedType: guessStatementType(text),
        competenceIds: detectCompetences(text, index),
      });
    }
  }
  return candidates;
}
