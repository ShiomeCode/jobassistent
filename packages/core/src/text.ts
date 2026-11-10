// Danish text normalization: tokenizing, stop word removal, stemming and compound splitting.
// Everything here is deterministic and runs in the browser without any AI.

/// <reference path="./snowball-stemmers.d.ts" />
import { newStemmer } from "snowball-stemmers";
import stopwordList from "../data/stopwords.da.json";

const danishStemmer = newStemmer("danish");
const STOPWORDS: ReadonlySet<string> = new Set(stopwordList);

/** Shortest part a compound word may be split into, e.g. "projekt" + "ledelse". */
const MIN_COMPOUND_PART_LENGTH = 3;

/** Danish linking letters between compound parts, e.g. the "s" in "ledelses|erfaring". */
const COMPOUND_LINKING_LETTERS = ["s", "e"];

const TOKEN_PATTERN = /[\p{L}\p{N}]+[#+]*/gu;

export interface AnalyzedToken {
  /** Normalized form used for matching. */
  stem: string;
  /** The word as written in the text (lower case). */
  surface: string;
}

/** Splits text into lower-case words. Keeps tech names such as "c#", "c++" and ".net" (as "dotnet"). */
export function tokenize(text: string): string[] {
  const prepared = text.toLowerCase().replace(/\.net\b/g, " dotnet ");
  return prepared.match(TOKEN_PATTERN) ?? [];
}

/** Returns the Danish stem of a single word. Words with symbols or digits are returned unchanged. */
export function stemWord(word: string): string {
  if (/[#+\d]/.test(word)) {
    return word;
  }
  return danishStemmer.stem(word);
}

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word);
}

/**
 * Tries to split a stem into known parts, e.g. "projektled" -> ["projekt", "led"].
 * A split is accepted when the tail is in the vocabulary. The longest known tail wins.
 * Returns an empty list when no split is found.
 */
export function splitCompound(stem: string, vocabulary: ReadonlySet<string>): string[] {
  for (let splitIndex = MIN_COMPOUND_PART_LENGTH; splitIndex <= stem.length - MIN_COMPOUND_PART_LENGTH; splitIndex++) {
    const tail = stem.slice(splitIndex);
    if (!vocabulary.has(tail)) {
      continue;
    }
    const head = stem.slice(0, splitIndex);
    const headWithoutLinking = removeLinkingLetter(head, vocabulary);
    return [headWithoutLinking, tail];
  }
  return [];
}

/** Finds the known stem of a compound head, e.g. "ledelses" -> "ledelse" -> "led". Falls back to the stemmed head. */
function removeLinkingLetter(head: string, vocabulary: ReadonlySet<string>): string {
  const candidates = [head];
  for (const letter of COMPOUND_LINKING_LETTERS) {
    const withoutLetter = head.slice(0, -1);
    if (head.endsWith(letter) && withoutLetter.length >= MIN_COMPOUND_PART_LENGTH) {
      candidates.push(withoutLetter);
    }
  }
  for (const candidate of candidates) {
    const knownForm = [candidate, stemWord(candidate)].find(form => vocabulary.has(form));
    if (knownForm !== undefined) {
      return knownForm;
    }
  }
  return stemWord(head);
}

/**
 * Turns text into tokens ready for matching: lower case, no stop words, stemmed.
 * When a vocabulary is given, compound words also add their parts as extra tokens.
 */
export function analyzeTokens(text: string, vocabulary: ReadonlySet<string> = new Set()): AnalyzedToken[] {
  const tokens: AnalyzedToken[] = [];
  for (const word of tokenize(text)) {
    if (word.length < 2 || isStopword(word)) {
      continue;
    }
    const stem = stemWord(word);
    tokens.push({ stem, surface: word });
    for (const part of splitCompound(stem, vocabulary)) {
      if (part !== stem) {
        tokens.push({ stem: part, surface: word });
      }
    }
  }
  return tokens;
}

export interface TextRange {
  start: number;
  end: number;
}

/**
 * Finds the character ranges of words in a text whose stem (or a compound part) is in the given set.
 * Used to highlight matching words in the original job posting.
 */
export function findHighlightRanges(
  text: string,
  stemsToHighlight: ReadonlySet<string>,
  vocabulary: ReadonlySet<string> = new Set(),
): TextRange[] {
  const ranges: TextRange[] = [];
  const lowerText = text.toLowerCase();
  for (const match of lowerText.matchAll(TOKEN_PATTERN)) {
    const word = match[0];
    if (word.length < 2 || isStopword(word)) {
      continue;
    }
    const stem = stemWord(word);
    const stems = [stem, ...splitCompound(stem, vocabulary)];
    if (stems.some(candidate => stemsToHighlight.has(candidate))) {
      ranges.push({ start: match.index, end: match.index + word.length });
    }
  }
  return ranges;
}

/** Same as analyzeTokens, but returns only the stems. */
export function analyzeText(text: string, vocabulary: ReadonlySet<string> = new Set()): string[] {
  return analyzeTokens(text, vocabulary).map(token => token.stem);
}
