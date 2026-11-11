// Holds the application being written. Lives in App so the draft survives switching pages.

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_TEMPLATE, type Application, type ApplicationSlotContent, type Template } from "@jobassistent/core";

export interface ApplicationDraft {
  template: Template;
  /** Set once the draft has been saved, or when a saved application is opened. */
  applicationId: string | undefined;
  createdAt: string | undefined;
  title: string;
  postingText: string;
  /** The posting text the current matches were computed from. Empty until the user clicks "Find match". */
  matchedPostingText: string;
  slotContents: Record<string, ApplicationSlotContent>;
  /** True when there are changes since the last save (or since a new draft was started). */
  isDirty: boolean;
  setTitle: (title: string) => void;
  setPostingText: (text: string) => void;
  findMatches: () => void;
  editPosting: () => void;
  addStatementToSlot: (slotId: string, statementId: string) => void;
  removeStatementFromSlot: (slotId: string, statementId: string) => void;
  setSlotFreeText: (slotId: string, freeText: string) => void;
  /** Sets this application's own version of a statement. Pass undefined to go back to the bank text. */
  setStatementEdit: (slotId: string, statementId: string, text: string | undefined) => void;
  /** Swaps one statement for another in a slot, e.g. after an edit was saved as a new statement. */
  replaceStatementInSlot: (slotId: string, oldStatementId: string, newStatementId: string) => void;
  /** Builds the application to store, with a new id if the draft has never been saved. */
  toApplication: (createId: () => string, now?: Date) => Application;
  markSaved: (application: Application) => void;
  loadApplication: (application: Application) => void;
  reset: () => void;
}

function createEmptySlotContents(template: Template): Record<string, ApplicationSlotContent> {
  return Object.fromEntries(template.slots.map(slot => [slot.id, { statementIds: [], freeText: "" }]));
}

/** Returns a copy of the record without the key, or undefined when nothing is left. */
function withoutKey(record: Record<string, string> | undefined, keyToRemove: string): Record<string, string> | undefined {
  if (record === undefined) {
    return undefined;
  }
  const remainingEntries = Object.entries(record).filter(([key]) => key !== keyToRemove);
  return remainingEntries.length > 0 ? Object.fromEntries(remainingEntries) : undefined;
}

/** What counts as "the content" when deciding if there are unsaved changes. */
function createSnapshot(title: string, postingText: string, slotContents: Record<string, ApplicationSlotContent>): string {
  return JSON.stringify({ title, postingText, slotContents });
}

// Used on page: App (passed to ApplicationPage and ApplicationsPage)
export function useApplicationDraft(template: Template = DEFAULT_TEMPLATE): ApplicationDraft {
  const [applicationId, setApplicationId] = useState<string>();
  const [createdAt, setCreatedAt] = useState<string>();
  const [title, setTitle] = useState("");
  const [postingText, setPostingText] = useState("");
  const [matchedPostingText, setMatchedPostingText] = useState("");
  const [slotContents, setSlotContents] = useState(() => createEmptySlotContents(template));
  const [savedSnapshot, setSavedSnapshot] = useState(() => createSnapshot("", "", createEmptySlotContents(template)));

  const isDirty = useMemo(
    () => createSnapshot(title, postingText, slotContents) !== savedSnapshot,
    [title, postingText, slotContents, savedSnapshot],
  );

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
        editedTexts: withoutKey(content.editedTexts, statementId),
      }));
    },
    [updateSlot],
  );

  const setStatementEdit = useCallback(
    (slotId: string, statementId: string, text: string | undefined) => {
      updateSlot(slotId, content => ({
        ...content,
        editedTexts:
          text === undefined ? withoutKey(content.editedTexts, statementId) : { ...content.editedTexts, [statementId]: text },
      }));
    },
    [updateSlot],
  );

  const replaceStatementInSlot = useCallback(
    (slotId: string, oldStatementId: string, newStatementId: string) => {
      updateSlot(slotId, content => ({
        ...content,
        statementIds: content.statementIds.map(statementId => (statementId === oldStatementId ? newStatementId : statementId)),
        editedTexts: withoutKey(content.editedTexts, oldStatementId),
      }));
    },
    [updateSlot],
  );

  const setSlotFreeText = useCallback(
    (slotId: string, freeText: string) => updateSlot(slotId, content => ({ ...content, freeText })),
    [updateSlot],
  );

  const toApplication = (createId: () => string, now = new Date()): Application => {
    const timestamp = now.toISOString();
    return {
      id: applicationId ?? createId(),
      title: title.trim(),
      postingText,
      templateId: template.id,
      slots: slotContents,
      createdAt: createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  };

  const markSaved = (application: Application) => {
    setApplicationId(application.id);
    setCreatedAt(application.createdAt);
    setSavedSnapshot(createSnapshot(application.title, application.postingText, application.slots));
    setTitle(application.title);
  };

  const loadApplication = (application: Application) => {
    const slots = { ...createEmptySlotContents(template), ...application.slots };
    setApplicationId(application.id);
    setCreatedAt(application.createdAt);
    setTitle(application.title);
    setPostingText(application.postingText);
    setMatchedPostingText(application.postingText);
    setSlotContents(slots);
    setSavedSnapshot(createSnapshot(application.title, application.postingText, slots));
  };

  const reset = useCallback(() => {
    const emptySlots = createEmptySlotContents(template);
    setApplicationId(undefined);
    setCreatedAt(undefined);
    setTitle("");
    setPostingText("");
    setMatchedPostingText("");
    setSlotContents(emptySlots);
    setSavedSnapshot(createSnapshot("", "", emptySlots));
  }, [template]);

  return {
    template,
    applicationId,
    createdAt,
    title,
    postingText,
    matchedPostingText,
    slotContents,
    isDirty,
    setTitle,
    setPostingText,
    findMatches: () => setMatchedPostingText(postingText),
    editPosting: () => setMatchedPostingText(""),
    addStatementToSlot,
    removeStatementFromSlot,
    setSlotFreeText,
    setStatementEdit,
    replaceStatementInSlot,
    toApplication,
    markSaved,
    loadApplication,
    reset,
  };
}
