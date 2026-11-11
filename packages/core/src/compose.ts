// Turns the user's choices for each template slot into the final application: paragraphs, then a full letter.

import type { ApplicationSlotContent, Profile, Statement, Template } from "./types";

/**
 * Builds one paragraph per slot, in template order.
 * Within a slot the free text comes first, followed by the chosen statements.
 * Empty slots are skipped.
 */
export function composeApplicationParagraphs(
  template: Template,
  slotContents: Readonly<Record<string, ApplicationSlotContent>>,
  statements: readonly Statement[],
): string[] {
  const statementsById = new Map(statements.map(statement => [statement.id, statement]));

  const paragraphs = template.slots.map(slot => {
    const content = slotContents[slot.id];
    if (content === undefined) {
      return "";
    }
    const statementTexts = content.statementIds
      .map(statementId => statementsById.get(statementId)?.text.trim())
      .filter((text): text is string => text !== undefined && text.length > 0);
    return [content.freeText?.trim() ?? "", ...statementTexts].filter(part => part.length > 0).join(" ");
  });

  return paragraphs.filter(paragraph => paragraph.length > 0);
}

/** The application body as plain text, paragraphs separated by a blank line. */
export function composeApplicationText(
  template: Template,
  slotContents: Readonly<Record<string, ApplicationSlotContent>>,
  statements: readonly Statement[],
): string {
  return composeApplicationParagraphs(template, slotContents, statements).join("\n\n");
}

/** Everything needed to render the application as a letter, in any format (text, DOCX, print). */
export interface Letter {
  senderLines: string[];
  dateLine: string;
  heading: string;
  paragraphs: string[];
  signOff: string;
  signature: string;
}

export interface LetterInput {
  profile?: Profile;
  heading: string;
  paragraphs: string[];
  /** Already formatted in the user's language, e.g. "11. november 2026". */
  dateLine: string;
  /** Closing phrase in the user's language, e.g. "Med venlig hilsen". */
  signOff: string;
}

/** Combines the profile, heading and paragraphs into a letter. Empty profile fields are left out. */
export function buildLetter({ profile, heading, paragraphs, dateLine, signOff }: LetterInput): Letter {
  const senderLines = [profile?.name, profile?.address, profile?.phone, profile?.email]
    .map(line => line?.trim() ?? "")
    .filter(line => line.length > 0);

  return {
    senderLines,
    dateLine,
    heading: heading.trim(),
    paragraphs,
    signOff,
    signature: profile?.name.trim() ?? "",
  };
}

/** Renders a letter as plain text, for copying and .txt files. */
export function formatLetterAsText(letter: Letter): string {
  const blocks = [
    letter.senderLines.join("\n"),
    letter.dateLine,
    letter.heading,
    ...letter.paragraphs,
    [letter.signOff, letter.signature].filter(line => line.length > 0).join("\n"),
  ];
  return blocks.filter(block => block.length > 0).join("\n\n");
}
