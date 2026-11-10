// Left column of the application page: paste the posting, then see it highlighted with coverage.

import { useState } from "react";
import type { MatchingResult } from "../hooks/useMatching";
import { HighlightedText } from "./HighlightedText";
import { CoverageList } from "./CoverageList";
import { t } from "../texts";

interface PostingPanelProps {
  postingText: string;
  matchedPostingText: string;
  matching: MatchingResult | undefined;
  onPostingTextChange: (text: string) => void;
  onFindMatches: () => void;
  onEditPosting: () => void;
}

// Used on page: ApplicationPage
export function PostingPanel({
  postingText,
  matchedPostingText,
  matching,
  onPostingTextChange,
  onFindMatches,
  onEditPosting,
}: PostingPanelProps) {
  const [hasTriedEmpty, setHasTriedEmpty] = useState(false);
  const isShowingMatches = matching !== undefined;

  const handleFindMatches = () => {
    if (postingText.trim().length === 0) {
      setHasTriedEmpty(true);
      return;
    }
    setHasTriedEmpty(false);
    onFindMatches();
  };

  return (
    <section className="panel posting-panel" aria-labelledby="posting-heading">
      <div className="posting-panel__header">
        <h2 id="posting-heading">{t("application.postingLabel")}</h2>
        {isShowingMatches && (
          <button type="button" className="button button--quiet" onClick={onEditPosting}>
            {t("application.editPosting")}
          </button>
        )}
      </div>

      {isShowingMatches ? (
        <>
          <HighlightedText text={matchedPostingText} ranges={matching.highlightRanges} />
          <CoverageList coverage={matching.coverage} />
        </>
      ) : (
        <>
          <p className="field__hint" id="posting-hint">
            {t("application.postingHint")}
          </p>
          <textarea
            className="posting-panel__input"
            rows={14}
            value={postingText}
            aria-labelledby="posting-heading"
            aria-describedby="posting-hint"
            aria-invalid={hasTriedEmpty}
            onChange={event => onPostingTextChange(event.target.value)}
          />
          {hasTriedEmpty && <p className="field__error">{t("application.postingRequired")}</p>}
          <button type="button" className="button button--primary" onClick={handleFindMatches}>
            {t("application.findMatches")}
          </button>
        </>
      )}
    </section>
  );
}
