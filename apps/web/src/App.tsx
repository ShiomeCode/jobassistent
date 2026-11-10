import { useHashRoute } from "./hooks/useHashRoute";
import { useApplicationDraft } from "./hooks/useApplicationDraft";
import { AppHeader } from "./components/AppHeader";
import { BankPage } from "./pages/BankPage";
import { ApplicationPage } from "./pages/ApplicationPage";
import { BackupPage } from "./pages/BackupPage";
import { t } from "./texts";

export function App() {
  const route = useHashRoute();
  const applicationDraft = useApplicationDraft();

  return (
    <>
      <AppHeader currentRoute={route} />
      <main className="app-main">
        {route === "bank" && <BankPage />}
        {route === "application" && <ApplicationPage draft={applicationDraft} />}
        {route === "backup" && <BackupPage />}
      </main>
      <footer className="app-footer">
        <p>{t("app.tagline")}</p>
        <p>{t("app.footer")}</p>
      </footer>
    </>
  );
}
