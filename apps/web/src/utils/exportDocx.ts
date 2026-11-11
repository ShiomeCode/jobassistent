// Word (.docx) export. The docx library is loaded only when the user asks for a Word file,
// so it does not slow down the first page load.

import type { Letter } from "@jobassistent/core";
import { downloadBlob } from "./download";

const FONT = "Georgia";
const FONT_SIZE_HALF_POINTS = 22; // 11 pt
const HEADING_SIZE_HALF_POINTS = 28; // 14 pt
const PARAGRAPH_SPACING_TWIPS = 200; // 10 pt after each paragraph
const LINE_SPACING_TWIPS = 300; // 1.25 line height

export async function exportLetterAsDocx(letter: Letter, fileName: string): Promise<void> {
  const { AlignmentType, Document, Packer, Paragraph, TextRun } = await import("docx");

  const createLinesParagraph = (lines: string[], alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]) =>
    new Paragraph({
      alignment,
      spacing: { after: PARAGRAPH_SPACING_TWIPS * 2 },
      children: lines.map((line, lineIndex) => new TextRun({ text: line, break: lineIndex > 0 ? 1 : 0 })),
    });

  const children = [
    ...(letter.senderLines.length > 0 ? [createLinesParagraph(letter.senderLines)] : []),
    createLinesParagraph([letter.dateLine], AlignmentType.RIGHT),
    ...(letter.heading.length > 0
      ? [
          new Paragraph({
            spacing: { after: PARAGRAPH_SPACING_TWIPS * 1.5 },
            children: [new TextRun({ text: letter.heading, bold: true, size: HEADING_SIZE_HALF_POINTS })],
          }),
        ]
      : []),
    ...letter.paragraphs.map(
      paragraph =>
        new Paragraph({
          spacing: { after: PARAGRAPH_SPACING_TWIPS, line: LINE_SPACING_TWIPS },
          children: [new TextRun(paragraph)],
        }),
    ),
    createLinesParagraph([letter.signOff, letter.signature].filter(line => line.length > 0)),
  ];

  const document = new Document({
    creator: letter.signature || "Jobassistent",
    title: letter.heading,
    styles: { default: { document: { run: { font: FONT, size: FONT_SIZE_HALF_POINTS } } } },
    sections: [{ children }],
  });

  downloadBlob(fileName, await Packer.toBlob(document));
}
