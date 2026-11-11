// One section of the application letter: chosen statements, free text and ranked suggestions.

import { getCompetenceLabel, type ApplicationSlotContent, type Statement, type Suggestion, type TemplateSlot } from "@jobassistent/core";
import { competenceIndex } from "../competenceIndex";
import { ChosenStatement } from "./ChosenStatement";
import { t, tDynamic } from "../texts";

interface SlotEditorProps {
  slot: TemplateSlot;
  content: ApplicationSlotContent;
  suggestions: Suggestion[];
  statementsById: ReadonlyMap<string, Statement>;
  onAddStatement: (statementId: string) => void;
  onRemoveStatement: (statementId: string) => void;
  onFreeTextChange: (freeText: string) => void;
  onEditStatement: (statementId: string, text: string | undefined) => void;
  onUpdateStatementInBank: (statementId: string, text: string) => void;
  onSaveStatementAsNew: (statementId: string, text: string) => void;
}

function describeMatch(suggestion: Suggestion): string {
  const reasons = [
    ...suggestion.matchedCompetenceIds.map(competenceId => getCompetenceLabel(competenceId, competenceIndex)),
    ...suggestion.matchedWords,
  ];
  if (reasons.length === 0) {
    return t("application.noDirectMatch");
  }
  return t("application.matchedOn", { words: [...new Set(reasons)].join(", ") });
}

// Used on page: ApplicationPage
export function SlotEditor({
  slot,
  content,
  suggestions,
  statementsById,
  onAddStatement,
  onRemoveStatement,
  onFreeTextChange,
  onEditStatement,
  onUpdateStatementInBank,
  onSaveStatementAsNew,
}: SlotEditorProps) {
  const headingId = `slot-${slot.id}-heading`;
  const openSuggestions = suggestions.filter(suggestion => !content.statementIds.includes(suggestion.statementId));
  const isFull = content.statementIds.length >= slot.maxStatements;
  // Hide the suggestion box once every suggestion has been used, so it does not show up empty.
  const showsSuggestions = slot.maxStatements > 0 && (openSuggestions.length > 0 || content.statementIds.length === 0);

  return (
    <section className="slot" aria-labelledby={headingId}>
      <h3 id={headingId} className="slot__label">
        {tDynamic(slot.labelKey)}
      </h3>

      <div className="slot__letter">
        {slot.hasFreeText && (
          <textarea
            className="slot__free-text"
            rows={2}
            value={content.freeText ?? ""}
            placeholder={tDynamic(`slotPrompt.${slot.id}`)}
            aria-labelledby={headingId}
            onChange={event => onFreeTextChange(event.target.value)}
          />
        )}
        {content.statementIds.map(statementId => {
          const statement = statementsById.get(statementId);
          if (!statement) {
            return null;
          }
          return (
            <ChosenStatement
              key={statementId}
              statement={statement}
              editedText={content.editedTexts?.[statementId]}
              onRemove={() => onRemoveStatement(statementId)}
              onEdit={text => onEditStatement(statementId, text)}
              onUpdateInBank={text => onUpdateStatementInBank(statementId, text)}
              onSaveAsNew={text => onSaveStatementAsNew(statementId, text)}
            />
          );
        })}
      </div>

      {showsSuggestions && (
        <div className="slot__suggestions">
          <h4>{t("application.suggestions")}</h4>
          {openSuggestions.length === 0 && content.statementIds.length === 0 && (
            <p className="muted">{t("application.noSuggestions")}</p>
          )}
          {isFull && openSuggestions.length > 0 && <p className="muted">{t("application.slotFull")}</p>}
          <ul>
            {openSuggestions.map(suggestion => {
              const statement = statementsById.get(suggestion.statementId);
              if (!statement) {
                return null;
              }
              return (
                <li key={suggestion.statementId} className="suggestion" data-type={statement.type}>
                  <div className="suggestion__body">
                    <p className="suggestion__text">{statement.text}</p>
                    <p className="suggestion__reason">{describeMatch(suggestion)}</p>
                  </div>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    disabled={isFull}
                    aria-label={`${t("application.add")}: ${statement.text}`}
                    onClick={() => onAddStatement(suggestion.statementId)}
                  >
                    {t("application.add")}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
