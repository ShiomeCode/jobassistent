// Shows text with marker-pen highlights on the given character ranges. Line breaks are preserved.

import { Fragment } from "react";
import type { TextRange } from "@jobassistent/core";

interface HighlightedTextProps {
  text: string;
  ranges: TextRange[];
}

// Used on page: ApplicationPage (inside PostingPanel)
export function HighlightedText({ text, ranges }: HighlightedTextProps) {
  const parts: { text: string; isHighlighted: boolean }[] = [];
  let position = 0;
  for (const range of ranges) {
    if (range.start > position) {
      parts.push({ text: text.slice(position, range.start), isHighlighted: false });
    }
    parts.push({ text: text.slice(range.start, range.end), isHighlighted: true });
    position = range.end;
  }
  parts.push({ text: text.slice(position), isHighlighted: false });

  return (
    <div className="highlighted-text">
      {parts.map((part, partIndex) =>
        part.isHighlighted ? <mark key={partIndex}>{part.text}</mark> : <Fragment key={partIndex}>{part.text}</Fragment>,
      )}
    </div>
  );
}
