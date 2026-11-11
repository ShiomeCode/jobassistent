// CV import: read a CV, review the sentences found in it, and add the chosen ones to the bank.

import { useState } from "react";
import { extractStatementCandidates, getCompetenceLabel, type StatementType } from "@jobassistent/core";
import { useStatementBank } from "../hooks/useStatementBank";
import { getRouteHref } from "../hooks/useHashRoute";
import { FileTextButton } from "../components/FileTextButton";
import { competenceIndex } from "../competenceIndex";
import { createId, db } from "../db";
import { t, tDynamic } from "../texts";

const STATEMENT_TYPES: StatementType[] = ["result", "skill", "personality", "motivation"];

interface ReviewItem {
  id: string;
  text: string;
  type: StatementType;
  competenceIds: string[];
  isSelected: boolean;
  isAlreadyInBank: boolean;
}

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Used on page: App (route "import")
export function ImportPage() {
  const { statements } = useStatementBank();
  const [cvText, setCvText] = useState("");
  const [loadedFileName, setLoadedFileName] = useState<string>();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>();
  const [addedCount, setAddedCount] = useState<number>();

  const selectedCount = reviewItems?.filter(item => item.isSelected).length ?? 0;

  const findCandidates = (text: string) => {
    const bankTexts = new Set(statements.map(statement => normalizeForComparison(statement.text)));
    const candidates = extractStatementCandidates(text, competenceIndex);
    setReviewItems(
      candidates.map(candidate => {
        const isAlreadyInBank = bankTexts.has(normalizeForComparison(candidate.text));
        return {
          id: candidate.id,
          text: candidate.text,
          type: candidate.suggestedType,
          competenceIds: candidate.competenceIds,
          isSelected: !isAlreadyInBank,
          isAlreadyInBank,
        };
      }),
    );
    setAddedCount(undefined);
  };

  const handleFileLoaded = (text: string, fileName: string) => {
    setCvText(text);
    setLoadedFileName(fileName);
    findCandidates(text);
  };

  const updateItem = (itemId: string, changes: Partial<ReviewItem>) => {
    setReviewItems(currentItems => currentItems?.map(item => (item.id === itemId ? { ...item, ...changes } : item)));
  };

  const setAllSelected = (isSelected: boolean) => {
    setReviewItems(currentItems => currentItems?.map(item => ({ ...item, isSelected })));
  };

  const handleAddToBank = async () => {
    const itemsToAdd = reviewItems?.filter(item => item.isSelected && item.text.trim().length > 0) ?? [];
    await db.statements.bulkAdd(
      itemsToAdd.map(item => ({ id: createId(), type: item.type, text: item.text.trim(), tags: [] })),
    );
    setAddedCount(itemsToAdd.length);
    setReviewItems(undefined);
    setCvText("");
    setLoadedFileName(undefined);
  };

  return (
    <div className="page import-page">
      <div className="page__intro">
        <h1>{t("import.heading")}</h1>
        <p>{t("import.intro")}</p>
      </div>

      {addedCount !== undefined && (
        <p className="notice import-page__done" role="status">
          {t("import.added", { count: addedCount })} <a href={getRouteHref("bank")}>{t("import.goToBank")}</a>
        </p>
      )}

      {reviewItems === undefined ? (
        <section className="panel import-page__source" aria-labelledby="import-source-heading">
          <h2 id="import-source-heading">{t("import.sourceHeading")}</h2>
          <FileTextButton labelKey="import.chooseFile" onTextLoaded={handleFileLoaded} />
          <label className="field">
            <span className="field__label">{t("import.pasteLabel")}</span>
            <textarea rows={10} value={cvText} onChange={event => setCvText(event.target.value)} />
          </label>
          <button
            type="button"
            className="button button--primary"
            disabled={cvText.trim().length === 0}
            onClick={() => findCandidates(cvText)}
          >
            {t("import.findSentences")}
          </button>
        </section>
      ) : (
        <section className="import-review" aria-labelledby="import-review-heading">
          <div className="import-review__header">
            <h2 id="import-review-heading">
              {t("import.reviewHeading", { count: reviewItems.length })}
              {loadedFileName && <span className="import-review__file">{loadedFileName}</span>}
            </h2>
            <p className="muted">{t("import.reviewHint")}</p>
            {reviewItems.length > 0 && (
              <div className="import-review__bulk">
                <button type="button" className="button button--quiet button--small" onClick={() => setAllSelected(true)}>
                  {t("import.selectAll")}
                </button>
                <button type="button" className="button button--quiet button--small" onClick={() => setAllSelected(false)}>
                  {t("import.selectNone")}
                </button>
              </div>
            )}
          </div>

          {reviewItems.length === 0 && <p className="empty-state">{t("import.noneFound")}</p>}

          <ul className="import-review__items">
            {reviewItems.map(item => (
              <li key={item.id} className={item.isSelected ? "review-item is-selected" : "review-item"} data-type={item.type}>
                <input
                  type="checkbox"
                  className="review-item__check"
                  checked={item.isSelected}
                  aria-label={t("import.include")}
                  onChange={event => updateItem(item.id, { isSelected: event.target.checked })}
                />
                <div className="review-item__body">
                  <textarea
                    className="review-item__text"
                    rows={2}
                    value={item.text}
                    aria-label={t("statementForm.text")}
                    onChange={event => updateItem(item.id, { text: event.target.value })}
                  />
                  <div className="review-item__meta">
                    <select
                      value={item.type}
                      aria-label={t("statementForm.type")}
                      onChange={event => updateItem(item.id, { type: event.target.value as StatementType })}
                    >
                      {STATEMENT_TYPES.map(statementType => (
                        <option key={statementType} value={statementType}>
                          {tDynamic(`statementType.${statementType}`)}
                        </option>
                      ))}
                    </select>
                    {item.competenceIds.map(competenceId => (
                      <span key={competenceId} className="tag tag--detected">
                        {getCompetenceLabel(competenceId, competenceIndex)}
                      </span>
                    ))}
                    {item.isAlreadyInBank && <span className="review-item__duplicate">{t("import.alreadyInBank")}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="import-review__actions">
            <button type="button" className="button button--primary" disabled={selectedCount === 0} onClick={handleAddToBank}>
              {t("import.addSelected", { count: selectedCount })}
            </button>
            <button type="button" className="button button--quiet" onClick={() => setReviewItems(undefined)}>
              {t("import.startOver")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
