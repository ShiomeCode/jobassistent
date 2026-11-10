// Write an application: paste a posting, see matches and coverage, and compose the letter.

import { useState } from "react";
import { composeApplicationText } from "@jobassistent/core";
import { useStatementBank } from "../hooks/useStatementBank";
import { useMatching } from "../hooks/useMatching";
import type { ApplicationDraft } from "../hooks/useApplicationDraft";
import { PostingPanel } from "../components/PostingPanel";
import { SlotEditor } from "../components/SlotEditor";
import { db } from "../db";
import { downloadFile, getDateStamp } from "../utils/download";
import { getRouteHref } from "../hooks/useHashRoute";
import { t } from "../texts";

interface ApplicationPageProps {
  draft: ApplicationDraft;
}

const COPIED_MESSAGE_DURATION_MS = 2500;

// Used on page: App (route "application")
export function ApplicationPage({ draft }: ApplicationPageProps) {
  const { statements, isLoading } = useStatementBank();
  const matching = useMatching(draft.matchedPostingText, statements, draft.template);
  const [isCopied, setIsCopied] = useState(false);

  const statementsById = new Map(statements.map(statement => [statement.id, statement]));
  const applicationText = composeApplicationText(draft.template, draft.slotContents, statements);
  const hasText = applicationText.length > 0;

  const markStatementsAsUsed = async () => {
    const usedIds = Object.values(draft.slotContents).flatMap(content => content.statementIds);
    const now = new Date().toISOString();
    await db.statements.bulkUpdate(usedIds.map(statementId => ({ key: statementId, changes: { lastUsed: now } })));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(applicationText);
    await markStatementsAsUsed();
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), COPIED_MESSAGE_DURATION_MS);
  };

  const handleDownload = async () => {
    downloadFile(`ansoegning-${getDateStamp()}.txt`, applicationText, "text/plain;charset=utf-8");
    await markStatementsAsUsed();
  };

  return (
    <div className="page application-page">
      <div className="page__intro">
        <h1>{t("application.heading")}</h1>
        {!isLoading && statements.length === 0 && (
          <p className="notice">
            <a href={getRouteHref("bank")}>{t("application.emptyBank")}</a>
          </p>
        )}
      </div>

      <div className="application-page__layout">
        <PostingPanel
          postingText={draft.postingText}
          matchedPostingText={draft.matchedPostingText}
          matching={matching}
          onPostingTextChange={draft.setPostingText}
          onFindMatches={draft.findMatches}
          onEditPosting={draft.editPosting}
        />

        <section className="letter" aria-labelledby="letter-heading">
          <h2 id="letter-heading" className="letter__heading">
            {t("application.letterHeading")}
          </h2>

          {matching === undefined ? (
            <p className="muted">{t("application.letterEmpty")}</p>
          ) : (
            <>
              {draft.template.slots.map(slot => (
                <SlotEditor
                  key={slot.id}
                  slot={slot}
                  content={draft.slotContents[slot.id] ?? { statementIds: [] }}
                  suggestions={matching.suggestionsBySlot[slot.id] ?? []}
                  statementsById={statementsById}
                  onAddStatement={statementId => draft.addStatementToSlot(slot.id, statementId)}
                  onRemoveStatement={statementId => draft.removeStatementFromSlot(slot.id, statementId)}
                  onFreeTextChange={freeText => draft.setSlotFreeText(slot.id, freeText)}
                />
              ))}

              <div className="letter__actions">
                <button type="button" className="button button--primary" disabled={!hasText} onClick={handleCopy}>
                  {t("application.copy")}
                </button>
                <button type="button" className="button button--secondary" disabled={!hasText} onClick={handleDownload}>
                  {t("application.download")}
                </button>
                <button type="button" className="button button--quiet" onClick={draft.reset}>
                  {t("application.reset")}
                </button>
                <span className="letter__status" role="status">
                  {isCopied ? t("application.copied") : ""}
                </span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
