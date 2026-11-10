// Lets the user save generated content as a file, without any server.

export function downloadFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Today's date as yyyy-mm-dd, for file names. */
export function getDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
