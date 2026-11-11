// The application laid out as a letter. Hidden on screen and shown only when printing (or saving as PDF).

import type { Letter } from "@jobassistent/core";

interface PrintableLetterProps {
  letter: Letter;
}

// Used on page: ApplicationPage
export function PrintableLetter({ letter }: PrintableLetterProps) {
  return (
    <article className="printable-letter" aria-hidden="true">
      {letter.senderLines.length > 0 && (
        <p className="printable-letter__sender">
          {letter.senderLines.map(line => (
            <span key={line}>{line}</span>
          ))}
        </p>
      )}
      <p className="printable-letter__date">{letter.dateLine}</p>
      {letter.heading && <h1 className="printable-letter__heading">{letter.heading}</h1>}
      {letter.paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className="printable-letter__paragraph">
          {paragraph}
        </p>
      ))}
      <p className="printable-letter__sign-off">
        <span>{letter.signOff}</span>
        {letter.signature && <span>{letter.signature}</span>}
      </p>
    </article>
  );
}
