// An index card showing one statement from the bank, with its competences and edit/delete actions.

import { useState } from "react";
import { getCompetenceLabel, getStatementCompetences, type Statement } from "@jobassistent/core";
import { competenceIndex } from "../competenceIndex";
import { t } from "../texts";

interface StatementCardProps {
  statement: Statement;
  experienceTitle?: string;
  onEdit: (statement: Statement) => void;
  onDelete: (statementId: string) => void;
}

// Used on page: BankPage
export function StatementCard({ statement, experienceTitle, onEdit, onDelete }: StatementCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const competenceIds = getStatementCompetences(statement, competenceIndex);
  const userTagIds = new Set(statement.tags);

  return (
    <article className="statement-card" data-type={statement.type}>
      {experienceTitle && (
        <header className="statement-card__meta">
          <span className="statement-card__experience">{experienceTitle}</span>
        </header>
      )}

      <p className="statement-card__text">{statement.text}</p>
      {statement.shortText && <p className="statement-card__short">{statement.shortText}</p>}

      {competenceIds.length > 0 && (
        <ul className="tag-list" aria-label={t("statementForm.tags")}>
          {competenceIds.map(competenceId => (
            <li
              key={competenceId}
              className={userTagIds.has(competenceId) ? "tag" : "tag tag--detected"}
              title={userTagIds.has(competenceId) ? undefined : t("statementCard.detected")}
            >
              {getCompetenceLabel(competenceId, competenceIndex)}
            </li>
          ))}
        </ul>
      )}

      <footer className="statement-card__actions">
        <button type="button" className="button button--quiet" onClick={() => onEdit(statement)}>
          {t("common.edit")}
        </button>
        {isConfirmingDelete ? (
          <>
            <button type="button" className="button button--danger" onClick={() => onDelete(statement.id)}>
              {t("common.confirmDelete")}
            </button>
            <button type="button" className="button button--quiet" onClick={() => setIsConfirmingDelete(false)}>
              {t("common.cancel")}
            </button>
          </>
        ) : (
          <button type="button" className="button button--quiet" onClick={() => setIsConfirmingDelete(true)}>
            {t("common.delete")}
          </button>
        )}
      </footer>
    </article>
  );
}
