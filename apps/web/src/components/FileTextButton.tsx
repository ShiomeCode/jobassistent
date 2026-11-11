// A button that lets the user pick a PDF, Word or text file and hands back the text inside it.

import { useRef, useState, type ChangeEvent } from "react";
import { ACCEPTED_TEXT_FILES, extractFileText, FileTextError } from "../utils/extractFileText";
import { t, tDynamic, type TextKey } from "../texts";

interface FileTextButtonProps {
  labelKey: TextKey;
  onTextLoaded: (text: string, fileName: string) => void;
}

// Used on page: ApplicationPage (inside PostingPanel), ImportPage
export function FileTextButton({ labelKey, onTextLoaded }: FileTextButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [errorKey, setErrorKey] = useState<string>();

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setIsReading(true);
    setErrorKey(undefined);
    try {
      onTextLoaded(await extractFileText(file), file.name);
    } catch (error) {
      setErrorKey(error instanceof FileTextError ? `fileText.error.${error.errorKey}` : "fileText.error.unreadableFile");
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div className="file-text-button">
      <button type="button" className="button button--secondary" disabled={isReading} onClick={() => fileInputRef.current?.click()}>
        {isReading ? t("fileText.reading") : t(labelKey)}
      </button>
      <span className="field__hint">{t("fileText.hint")}</span>
      <input ref={fileInputRef} type="file" accept={ACCEPTED_TEXT_FILES} hidden onChange={handleFileChosen} />
      {errorKey && (
        <p className="field__error" role="alert">
          {tDynamic(errorKey)}
        </p>
      )}
    </div>
  );
}
