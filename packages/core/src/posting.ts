// Job posting parsing: splits a posting into requirements and finds out which section each belongs to.

import type { PostingSection, Requirement } from "./types";
import { detectCompetences, type CompetenceIndex } from "./competences";

/** Heading phrases per section. Checked in this order, so "om os" wins over "om dig"-like phrases. */
const SECTION_KEYWORDS: ReadonlyArray<[PostingSection, readonly string[]]> = [
  ["aboutUs", ["om os", "vi tilbyder", "vi kan tilbyde", "om virksomheden", "om afdelingen", "om teamet", "løn", "ansøgning", "kontakt", "tiltrædelse", "yderligere oplysninger", "ansættelsesvilkår", "what we offer", "about us"]],
  ["expectations", ["vi forventer", "forventninger", "om dig", "du har", "du er", "din profil", "kvalifikationer", "krav", "vi søger", "vi leder efter", "kompetencer", "your profile", "qualifications", "requirements"]],
  ["tasks", ["opgaver", "arbejdsopgaver", "jobbet", "stillingen", "ansvarsområder", "ansvar", "du kommer til", "hverdag", "responsibilities", "the role"]],
];

/** Matches the bullet at the start of a list line: "- ", "• ", "1. " and similar. */
export const BULLET_PATTERN = /^\s*(?:[-•*–·▪◦]|\d+[.)])\s+/;
/** Splits between sentences: after . ! or ? when the next word starts with a capital letter or digit. */
export const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+(?=[A-ZÆØÅ0-9])/;
const MAX_HEADING_LENGTH = 80;
const MAX_HEADING_WORDS_WITHOUT_COLON = 5;

export function detectSection(heading: string): PostingSection | undefined {
  const lowerHeading = heading.toLowerCase();
  for (const [section, keywords] of SECTION_KEYWORDS) {
    if (keywords.some(keyword => lowerHeading.includes(keyword))) {
      return section;
    }
  }
  return undefined;
}

function isHeading(line: string): boolean {
  if (line.length > MAX_HEADING_LENGTH || BULLET_PATTERN.test(line)) {
    return false;
  }
  if (line.endsWith(":")) {
    return true;
  }
  const wordCount = line.split(/\s+/).length;
  const hasSentenceEnding = /[.!?]$/.test(line);
  return !hasSentenceEnding && wordCount <= MAX_HEADING_WORDS_WITHOUT_COLON && detectSection(line) !== undefined;
}

/** Splits a job posting into requirements: one per bullet point or sentence. */
export function extractRequirements(postingText: string, index: CompetenceIndex): Requirement[] {
  const requirements: Requirement[] = [];
  let currentSection: PostingSection = "other";

  const addRequirement = (text: string) => {
    const trimmedText = text.trim();
    if (trimmedText.length < 3) {
      return;
    }
    requirements.push({
      id: `req-${requirements.length + 1}`,
      text: trimmedText,
      section: currentSection,
      competenceIds: detectCompetences(trimmedText, index),
    });
  };

  for (const rawLine of postingText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }
    if (isHeading(line)) {
      currentSection = detectSection(line) ?? "other";
      continue;
    }
    if (BULLET_PATTERN.test(line)) {
      addRequirement(line.replace(BULLET_PATTERN, ""));
      continue;
    }
    line.split(SENTENCE_SPLIT_PATTERN).forEach(addRequirement);
  }

  return requirements;
}
