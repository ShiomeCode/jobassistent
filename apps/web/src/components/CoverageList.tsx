// Lists the requirements of a posting and whether the user's bank covers each one.

import type { Coverage } from "@jobassistent/core";
import { t, tDynamic } from "../texts";

interface CoverageListProps {
  coverage: Coverage;
}

// Used on page: ApplicationPage (inside PostingPanel)
export function CoverageList({ coverage }: CoverageListProps) {
  if (coverage.totalCount === 0) {
    return null;
  }
  const coveredShare = coverage.coveredCount / coverage.totalCount;

  return (
    <section className="coverage" aria-labelledby="coverage-heading">
      <div className="coverage__summary">
        <h3 id="coverage-heading">{t("application.coverageHeading")}</h3>
        <p>{t("application.coverage", { covered: coverage.coveredCount, total: coverage.totalCount })}</p>
        <div className="coverage__bar" aria-hidden="true">
          <div className="coverage__bar-fill" style={{ width: `${coveredShare * 100}%` }} />
        </div>
      </div>
      <ul className="coverage__items">
        {coverage.items.map(item => {
          const isCovered = item.coveringStatementIds.length > 0;
          return (
            <li key={item.requirement.id} className={isCovered ? "coverage__item is-covered" : "coverage__item"}>
              <span className="coverage__section">{tDynamic(`section.${item.requirement.section}`)}</span>
              <span className="coverage__text">{item.requirement.text}</span>
              {!isCovered && <span className="coverage__hint">{t("application.uncoveredHint")}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
