// Lets the user save generated content as a file, without any server.

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Give the browser a moment to start the download before the URL is released.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadFile(fileName: string, content: string, mimeType: string): void {
  downloadBlob(fileName, new Blob([content], { type: mimeType }));
}

/** Today's date as yyyy-mm-dd, for file names. */
export function getDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Turns a title into a safe file name part, e.g. "Ansøgning: Frontendudvikler" -> "ansoegning-frontendudvikler". */
export function createFileSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
