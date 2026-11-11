// Reads the text out of a file the user picks: PDF, Word (.docx) or plain text.
// Everything happens in the browser. The PDF and Word libraries are loaded only when needed.

export type FileTextErrorKey = "unsupportedFile" | "unreadableFile" | "emptyFile";

export class FileTextError extends Error {
  constructor(readonly errorKey: FileTextErrorKey) {
    super(errorKey);
  }
}

/** File types the pickers accept. */
export const ACCEPTED_TEXT_FILES =
  ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

type FileKind = "pdf" | "docx" | "text";

function detectFileKind(file: File): FileKind | undefined {
  const lowerName = file.name.toLowerCase();
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  if (lowerName.endsWith(".docx")) {
    return "docx";
  }
  if (file.type.startsWith("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return "text";
  }
  return undefined;
}

/** Rebuilds lines from a PDF's text pieces: pieces marked as ending a line get a line break after them. */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : ""}` : ""))
      .join("");
    pageTexts.push(pageText);
  }
  // Stops the worker so it does not keep running in the background.
  await loadingTask.destroy();
  return pageTexts.join("\n");
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

/** Returns the text of the file with tidy line breaks. Throws FileTextError with a key for the UI text. */
export async function extractFileText(file: File): Promise<string> {
  const fileKind = detectFileKind(file);
  if (fileKind === undefined) {
    throw new FileTextError("unsupportedFile");
  }

  let rawText: string;
  try {
    if (fileKind === "pdf") {
      rawText = await extractPdfText(file);
    } else if (fileKind === "docx") {
      rawText = await extractDocxText(file);
    } else {
      rawText = await file.text();
    }
  } catch {
    throw new FileTextError("unreadableFile");
  }

  const tidyText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (tidyText.length === 0) {
    throw new FileTextError("emptyFile");
  }
  return tidyText;
}
