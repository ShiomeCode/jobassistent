// Turns the user's choices for each template slot into the final application text.

import type { ApplicationSlotContent, Statement, Template } from "./types";

/**
 * Builds plain text with one paragraph per slot, in template order.
 * Within a slot the free text comes first, followed by the chosen statements.
 * Empty slots are skipped.
 */
export function composeApplicationText(
  template: Template,
  slotContents: Readonly<Record<string, ApplicationSlotContent>>,
  statements: readonly Statement[],
): string {
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

  return paragraphs.filter(paragraph => paragraph.length > 0).join("\n\n");
}
