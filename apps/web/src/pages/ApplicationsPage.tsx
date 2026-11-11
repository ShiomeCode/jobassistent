// List of saved applications: open one to keep working on it, or delete it.

import { useState } from "react";
import type { Application } from "@jobassistent/core";
import { useSavedApplications } from "../hooks/useSavedApplications";
import type { ApplicationDraft } from "../hooks/useApplicationDraft";
import { getRouteHref, navigateTo } from "../hooks/useHashRoute";
import { deleteApplication } from "../db";
import { formatLongDate, t } from "../texts";

interface ApplicationsPageProps {
  draft: ApplicationDraft;
}

const POSTING_PREVIEW_LENGTH = 140;

function getPostingPreview(application: Application): string {
  const compactText = application.postingText.replace(/\s+/g, " ").trim();
  return compactText.length > POSTING_PREVIEW_LENGTH ? `${compactText.slice(0, POSTING_PREVIEW_LENGTH)}…` : compactText;
}

// Used on page: App (route "applications")
export function ApplicationsPage({ draft }: ApplicationsPageProps) {
  const { applications, isLoading } = useSavedApplications();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string>();

  const handleOpen = (application: Application) => {
    draft.loadApplication(application);
    navigateTo("application");
  };

  const handleNew = () => {
    draft.reset();
    navigateTo("application");
  };

  const handleDelete = async (applicationId: string) => {
    await deleteApplication(applicationId);
    setConfirmingDeleteId(undefined);
  };

  return (
    <div className="page applications-page">
      <div className="page__intro">
        <h1>{t("applications.heading")}</h1>
        <p>{t("applications.intro")}</p>
      </div>

      {draft.isDirty && (
        <p className="notice applications-page__warning">
          {t("applications.unsavedWarning")} <a href={getRouteHref("application")}>{t("applications.backToDraft")}</a>
        </p>
      )}

      <div className="applications-page__toolbar">
        <button type="button" className="button button--primary" onClick={handleNew}>
          {t("application.newApplication")}
        </button>
      </div>

      {!isLoading && applications.length === 0 && <p className="empty-state">{t("applications.empty")}</p>}

      <ul className="application-list">
        {applications.map(application => {
          const isOpenInDraft = application.id === draft.applicationId;
          return (
            <li key={application.id} className="application-list__item">
              <div className="application-list__body">
                <h2 className="application-list__title">{application.title || t("applications.untitled")}</h2>
                <p className="application-list__meta">
                  {t("applications.updated", { date: formatLongDate(new Date(application.updatedAt)) })}
                  {isOpenInDraft && <span className="application-list__badge">{t("applications.isOpen")}</span>}
                </p>
                <p className="application-list__preview">{getPostingPreview(application)}</p>
              </div>
              <div className="application-list__actions">
                <button type="button" className="button button--secondary" onClick={() => handleOpen(application)}>
                  {t("applications.open")}
                </button>
                {confirmingDeleteId === application.id ? (
                  <>
                    <button type="button" className="button button--danger" onClick={() => handleDelete(application.id)}>
                      {t("common.confirmDelete")}
                    </button>
                    <button type="button" className="button button--quiet" onClick={() => setConfirmingDeleteId(undefined)}>
                      {t("common.cancel")}
                    </button>
                  </>
                ) : (
                  <button type="button" className="button button--quiet" onClick={() => setConfirmingDeleteId(application.id)}>
                    {t("common.delete")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
