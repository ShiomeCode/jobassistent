// Holds the application being written. Lives in App so the draft survives switching pages.

import { useCallback, useState } from "react";
import { DEFAULT_TEMPLATE, type ApplicationSlotContent, type Template } from "@jobassistent/core";

export interface ApplicationDraft {
  template: Template;
  postingText: string;
  /** The posting text the current matches were computed from. Empty until the user clicks "Find match". */
  matchedPostingText: string;
  slotContents: Record<string, ApplicationSlotContent>;
  setPostingText: (text: string) => void;
  findMatches: () => void;
  editPosting: () => void;
  addStatementToSlot: (slotId: string, statementId: string) => void;
  removeStatementFromSlot: (slotId: string, statementId: string) => void;
  setSlotFreeText: (slotId: string, freeText: string) => void;
  reset: () => void;
}

function createEmptySlotContents(template: Template): Record<string, ApplicationSlotContent> {
  return Object.fromEntries(template.slots.map(slot => [slot.id, { statementIds: [], freeText: "" }]));
}

// Used on page: App (passed to ApplicationPage)
export function useApplicationDraft(template: Template = DEFAULT_TEMPLATE): ApplicationDraft {
  const [postingText, setPostingText] = useState("");
  const [matchedPostingText, setMatchedPostingText] = useState("");
  const [slotContents, setSlotContents] = useState(() => createEmptySlotContents(template));

  const updateSlot = useCallback((slotId: string, update: (content: ApplicationSlotContent) => ApplicationSlotContent) => {
    setSlotContents(previousContents => {
      const currentContent = previousContents[slotId] ?? { statementIds: [] };
      return { ...previousContents, [slotId]: update(currentContent) };
    });
  }, []);

  const addStatementToSlot = useCallback(
    (slotId: string, statementId: string) => {
      const maxStatements = template.slots.find(slot => slot.id === slotId)?.maxStatements ?? 0;
      updateSlot(slotId, content =>
        content.statementIds.includes(statementId) || content.statementIds.length >= maxStatements
          ? content
          : { ...content, statementIds: [...content.statementIds, statementId] },
      );
    },
    [template, updateSlot],
  );

  const removeStatementFromSlot = useCallback(
    (slotId: string, statementId: string) => {
      updateSlot(slotId, content => ({
        ...content,
        statementIds: content.statementIds.filter(existingId => existingId !== statementId),
      }));
    },
    [updateSlot],
  );

  const setSlotFreeText = useCallback(
    (slotId: string, freeText: string) => updateSlot(slotId, content => ({ ...content, freeText })),
    [updateSlot],
  );

  const reset = useCallback(() => {
    setPostingText("");
    setMatchedPostingText("");
    setSlotContents(createEmptySlotContents(template));
  }, [template]);

  return {
    template,
    postingText,
    matchedPostingText,
    slotContents,
    setPostingText,
    findMatches: () => setMatchedPostingText(postingText),
    editPosting: () => setMatchedPostingText(""),
    addStatementToSlot,
    removeStatementFromSlot,
    setSlotFreeText,
    reset,
  };
}
