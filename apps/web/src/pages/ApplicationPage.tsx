// Write an application: paste a posting, see matches and coverage, compose the letter, then save or export it.

import { useState } from "react";
import { buildLetter, composeApplicationParagraphs, formatLetterAsText } from "@jobassistent/core";
import { useStatementBank } from "../hooks/useStatementBank";
import { useProfile } from "../hooks/useProfile";
import { useMatching } from "../hooks/useMatching";
import type { ApplicationDraft } from "../hooks/useApplicationDraft";
import { PostingPanel } from "../components/PostingPanel";
import { SlotEditor } from "../components/SlotEditor";
import { PrintableLetter } from "../components/PrintableLetter";
import { createId, markStatementsAsUsed, saveApplication, saveStatement } from "../db";
import { createFileSlug, downloadFile, getDateStamp } from "../utils/download";
import { exportLetterAsDocx } from "../utils/exportDocx";
import { getRouteHref } from "../hooks/useHashRoute";
import { formatLongDate, t } from "../texts";

interface ApplicationPageProps {
  draft: ApplicationDraft;
}

type ActionStatus = "idle" | "copied" | "docxFailed";

const STATUS_MESSAGE_DURATION_MS = 2500;
const MAX_SUGGESTED_TITLE_LENGTH = 80;

/** Uses the first line of the posting (usually the job title) as a starting point for the heading. */
function suggestTitle(postingText: string): string {
  const firstLine = postingText.split(/\r?\n/).find(line => line.trim().length > 0)?.trim() ?? "";
  return firstLine.slice(0, MAX_SUGGESTED_TITLE_LENGTH);
}

// Used on page: App (route "application")
export function ApplicationPage({ draft }: ApplicationPageProps) {
  const { statements, isLoading } = useStatementBank();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const matching = useMatching(draft.matchedPostingText, statements, draft.template);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");

  const statementsById = new Map(statements.map(statement => [statement.id, statement]));
  const paragraphs = composeApplicationParagraphs(draft.template, draft.slotContents, statements);
  const letter = buildLetter({
    profile,
    heading: draft.title,
    paragraphs,
    dateLine: formatLongDate(new Date()),
    signOff: t("letter.signOff"),
  });
  const hasText = paragraphs.length > 0;
  const fileNameBase = `${createFileSlug(draft.title) || "ansoegning"}-${getDateStamp()}`;
  const isSaved = !draft.isDirty && draft.applicationId !== undefined;
  const usedStatementIds = Object.values(draft.slotContents).flatMap(content => content.statementIds);

  const showStatus = (status: ActionStatus) => {
    setActionStatus(status);
    window.setTimeout(() => setActionStatus("idle"), STATUS_MESSAGE_DURATION_MS);
  };

  /** Overwrites the statement in the bank with the edited text. Other applications using it will change too. */
  const handleUpdateStatementInBank = async (slotId: string, statementId: string, text: string) => {
    const statement = statementsById.get(statementId);
    if (!statement) {
      return;
    }
    await saveStatement({ ...statement, text });
    draft.setStatementEdit(slotId, statementId, undefined);
  };

  /** Keeps the original and adds the edited text as a new statement of the same type, then uses the new one here. */
  const handleSaveStatementAsNew = async (slotId: string, statementId: string, text: string) => {
    const statement = statementsById.get(statementId);
    if (!statement) {
      return;
    }
    const newStatement = { ...statement, id: createId(), text, shortText: undefined, lastUsed: undefined };
    await saveStatement(newStatement);
    draft.replaceStatementInSlot(slotId, statementId, newStatement.id);
  };

  const handleFindMatches = () => {
    if (draft.title.trim().length === 0) {
      draft.setTitle(suggestTitle(draft.postingText));
    }
    draft.findMatches();
  };

  const handleSave = async () => {
    const application = draft.toApplication(createId);
    await saveApplication(application);
    await markStatementsAsUsed(usedStatementIds);
    draft.markSaved(application);
  };

  const handleCopyBody = async () => {
    await navigator.clipboard.writeText(paragraphs.join("\n\n"));
    await markStatementsAsUsed(usedStatementIds);
    showStatus("copied");
  };

  const handleDownloadDocx = async () => {
    try {
      await exportLetterAsDocx(letter, `${fileNameBase}.docx`);
      await markStatementsAsUsed(usedStatementIds);
    } catch {
      showStatus("docxFailed");
    }
  };

  const handlePrint = async () => {
    await markStatementsAsUsed(usedStatementIds);
    window.print();
  };

  const handleDownloadText = async () => {
    downloadFile(`${fileNameBase}.txt`, formatLetterAsText(letter), "text/plain;charset=utf-8");
    await markStatementsAsUsed(usedStatementIds);
  };

  return (
    <div className="page application-page">
      <div className="page__intro">
        <h1>{t(draft.applicationId ? "application.editHeading" : "application.heading")}</h1>
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
          onFindMatches={handleFindMatches}
          onEditPosting={draft.editPosting}
        />

        <section className="letter" aria-labelledby="letter-heading">
          <div className="letter__top">
            <h2 id="letter-heading" className="letter__heading">
              {t("application.letterHeading")}
            </h2>
            {matching !== undefined && (
              <span className={isSaved ? "save-state is-saved" : "save-state"}>
                {isSaved ? t("application.saved") : t("application.unsaved")}
              </span>
            )}
          </div>

          {matching === undefined ? (
            <p className="muted">{t("application.letterEmpty")}</p>
          ) : (
            <>
              {!isProfileLoading && !profile && (
                <p className="notice">
                  <a href={getRouteHref("bank")}>{t("application.profileMissing")}</a>
                </p>
              )}

              <label className="field letter__title">
                <span className="field__label">{t("application.title")}</span>
                <input
                  type="text"
                  value={draft.title}
                  placeholder={t("application.titlePlaceholder")}
                  onChange={event => draft.setTitle(event.target.value)}
                />
              </label>

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
                  onEditStatement={(statementId, text) => draft.setStatementEdit(slot.id, statementId, text)}
                  onUpdateStatementInBank={(statementId, text) => handleUpdateStatementInBank(slot.id, statementId, text)}
                  onSaveStatementAsNew={(statementId, text) => handleSaveStatementAsNew(slot.id, statementId, text)}
                />
              ))}

              <div className="letter__actions">
                <button type="button" className="button button--primary" disabled={!draft.isDirty} onClick={handleSave}>
                  {t("application.save")}
                </button>
                <button type="button" className="button button--quiet" onClick={draft.reset}>
                  {t("application.newApplication")}
                </button>
              </div>

              <div className="letter__export" role="group" aria-labelledby="export-heading">
                <h3 id="export-heading">{t("application.exportHeading")}</h3>
                <div className="letter__export-buttons">
                  <button type="button" className="button button--secondary" disabled={!hasText} onClick={handleDownloadDocx}>
                    {t("application.downloadDocx")}
                  </button>
                  <button type="button" className="button button--secondary" disabled={!hasText} onClick={handlePrint}>
                    {t("application.print")}
                  </button>
                  <button type="button" className="button button--secondary" disabled={!hasText} onClick={handleCopyBody}>
                    {t("application.copyBody")}
                  </button>
                  <button type="button" className="button button--quiet" disabled={!hasText} onClick={handleDownloadText}>
                    {t("application.downloadText")}
                  </button>
                </div>
                <p role="status" className={actionStatus === "docxFailed" ? "field__error" : "letter__status"}>
                  {actionStatus === "copied" && t("application.copied")}
                  {actionStatus === "docxFailed" && t("application.docxFailed")}
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <PrintableLetter letter={letter} />
    </div>
  );
}
