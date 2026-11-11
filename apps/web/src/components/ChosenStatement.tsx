// A statement placed in the letter. It can be edited for this application only,
// and the edit can then be saved back to the bank, either replacing the original or as a new statement.

import { useState } from "react";
import type { Statement } from "@jobassistent/core";
import { t } from "../texts";

interface ChosenStatementProps {
  statement: Statement;
  /** This application's own version of the text, if the user has edited it. */
  editedText: string | undefined;
  onRemove: () => void;
  onEdit: (text: string | undefined) => void;
  onUpdateInBank: (text: string) => void;
  onSaveAsNew: (text: string) => void;
}

// Used on page: ApplicationPage (inside SlotEditor)
export function ChosenStatement({ statement, editedText, onRemove, onEdit, onUpdateInBank, onSaveAsNew }: ChosenStatementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const displayText = editedText ?? statement.text;
  const isEdited = editedText !== undefined;

  const startEditing = () => {
    setDraftText(displayText);
    setIsEditing(true);
  };

  const finishEditing = () => {
    const trimmedText = draftText.trim();
    // Editing back to the bank text, or clearing the field, means "no edit".
    const isSameAsBank = trimmedText === statement.text.trim() || trimmedText.length === 0;
    onEdit(isSameAsBank ? undefined : trimmedText);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="chosen-statement is-editing">
        <textarea
          className="chosen-statement__editor"
          rows={3}
          value={draftText}
          aria-label={t("application.editStatementLabel")}
          autoFocus
          onChange={event => setDraftText(event.target.value)}
        />
        <div className="chosen-statement__actions">
          <button type="button" className="button button--secondary button--small" onClick={finishEditing}>
            {t("application.doneEditing")}
          </button>
          <button type="button" className="button button--quiet button--small" onClick={() => setIsEditing(false)}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isEdited ? "chosen-statement is-edited" : "chosen-statement"}>
      <div className="chosen-statement__row">
        <p>{displayText}</p>
        <div className="chosen-statement__actions">
          <button
            type="button"
            className="button button--quiet button--small"
            aria-label={`${t("application.editStatement")}: ${displayText}`}
            onClick={startEditing}
          >
            {t("application.editStatement")}
          </button>
          <button
            type="button"
            className="button button--quiet button--small"
            aria-label={`${t("application.remove")}: ${displayText}`}
            onClick={onRemove}
          >
            {t("application.remove")}
          </button>
        </div>
      </div>

      {isEdited && (
        <div className="chosen-statement__learn">
          <p>{t("application.editedForThis")}</p>
          <div className="chosen-statement__actions">
            <button type="button" className="button button--secondary button--small" onClick={() => onUpdateInBank(displayText)}>
              {t("application.updateInBank")}
            </button>
            <button type="button" className="button button--secondary button--small" onClick={() => onSaveAsNew(displayText)}>
              {t("application.saveAsNew")}
            </button>
            <button type="button" className="button button--quiet button--small" onClick={() => onEdit(undefined)}>
              {t("application.undoEdit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
