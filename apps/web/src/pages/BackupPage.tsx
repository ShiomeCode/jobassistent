// Export the bank to a JSON file, or replace it with an imported backup.

import { useRef, useState, type ChangeEvent } from "react";
import { createBankExport, parseBankExport } from "@jobassistent/core";
import { readBank, replaceBank } from "../db";
import { downloadFile, getDateStamp } from "../utils/download";
import { t, tDynamic } from "../texts";

type ImportStatus = { kind: "idle" } | { kind: "success"; statementCount: number } | { kind: "error"; errorKey: string };

// Used on page: App (route "backup")
export function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ kind: "idle" });

  const handleExport = async () => {
    const bankExport = createBankExport(await readBank());
    downloadFile(`jobassistent-backup-${getDateStamp()}.json`, JSON.stringify(bankExport, null, 2), "application/json");
  };

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(await file.text());
    } catch {
      setImportStatus({ kind: "error", errorKey: "backup.error.invalidJson" });
      return;
    }
    const result = parseBankExport(parsedJson);
    if (!result.isValid) {
      setImportStatus({ kind: "error", errorKey: `backup.error.${result.error}` });
      return;
    }
    await replaceBank(result.value);
    setImportStatus({ kind: "success", statementCount: result.value.statements.length });
  };

  return (
    <div className="page backup-page">
      <div className="page__intro">
        <h1>{t("backup.heading")}</h1>
        <p>{t("backup.intro")}</p>
      </div>

      <div className="panel backup-page__actions">
        <button type="button" className="button button--primary" onClick={handleExport}>
          {t("backup.export")}
        </button>
        <div>
          <button type="button" className="button button--secondary" onClick={() => fileInputRef.current?.click()}>
            {t("backup.import")}
          </button>
          <p className="field__hint">{t("backup.importHint")}</p>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleFileChosen} />
        </div>
        <p role="status" className={importStatus.kind === "error" ? "field__error" : "backup-page__success"}>
          {importStatus.kind === "success" && t("backup.imported", { count: importStatus.statementCount })}
          {importStatus.kind === "error" && tDynamic(importStatus.errorKey)}
        </p>
      </div>
    </div>
  );
}
