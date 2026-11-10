// Form for creating or editing a statement, with a competence picker that shows live detections.

import { useId, useMemo, useState, type FormEvent } from "react";
import { detectCompetences, type Experience, type Statement, type StatementType } from "@jobassistent/core";
import { competenceIndex, SORTED_COMPETENCES } from "../competenceIndex";
import { createId } from "../db";
import { t, tDynamic } from "../texts";

const STATEMENT_TYPES: StatementType[] = ["result", "skill", "personality", "motivation"];

interface StatementFormProps {
  initialStatement?: Statement;
  experiences: Experience[];
  onSave: (statement: Statement) => void;
  onCancel: () => void;
}

// Used on page: BankPage
export function StatementForm({ initialStatement, experiences, onSave, onCancel }: StatementFormProps) {
  const formId = useId();
  const [type, setType] = useState<StatementType>(initialStatement?.type ?? "result");
  const [text, setText] = useState(initialStatement?.text ?? "");
  const [shortText, setShortText] = useState(initialStatement?.shortText ?? "");
  const [experienceId, setExperienceId] = useState(initialStatement?.experienceId ?? "");
  const [tags, setTags] = useState<string[]>(initialStatement?.tags ?? []);
  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  const detectedIds = useMemo(() => new Set(detectCompetences(`${text} ${shortText}`, competenceIndex)), [text, shortText]);
  const isTextMissing = text.trim().length === 0;

  const toggleTag = (competenceId: string) => {
    setTags(currentTags =>
      currentTags.includes(competenceId)
        ? currentTags.filter(tag => tag !== competenceId)
        : [...currentTags, competenceId],
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setHasTriedToSave(true);
    if (isTextMissing) {
      return;
    }
    onSave({
      id: initialStatement?.id ?? createId(),
      type,
      text: text.trim(),
      shortText: shortText.trim() || undefined,
      experienceId: experienceId || undefined,
      tags,
      lastUsed: initialStatement?.lastUsed,
    });
  };

  return (
    <form className="panel form" onSubmit={handleSubmit} aria-labelledby={`${formId}-heading`}>
      <h2 id={`${formId}-heading`}>{t(initialStatement ? "statementForm.editHeading" : "statementForm.newHeading")}</h2>

      <fieldset className="type-picker">
        <legend>{t("statementForm.type")}</legend>
        {STATEMENT_TYPES.map(statementType => (
          <label key={statementType} className="type-picker__option" data-type={statementType}>
            <input
              type="radio"
              name={`${formId}-type`}
              value={statementType}
              checked={type === statementType}
              onChange={() => setType(statementType)}
            />
            <span className="type-picker__label">{tDynamic(`statementType.${statementType}`)}</span>
            <span className="type-picker__hint">{tDynamic(`statementTypeHint.${statementType}`)}</span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span className="field__label">{t("statementForm.text")}</span>
        <textarea
          rows={3}
          value={text}
          placeholder={t("statementForm.textPlaceholder")}
          aria-invalid={hasTriedToSave && isTextMissing}
          onChange={event => setText(event.target.value)}
        />
        {hasTriedToSave && isTextMissing && <span className="field__error">{t("statementForm.textRequired")}</span>}
      </label>

      <label className="field">
        <span className="field__label">{t("statementForm.shortText")}</span>
        <input type="text" value={shortText} onChange={event => setShortText(event.target.value)} />
      </label>

      {experiences.length > 0 && (
        <label className="field">
          <span className="field__label">{t("statementForm.experience")}</span>
          <select value={experienceId} onChange={event => setExperienceId(event.target.value)}>
            <option value="">{t("statementForm.noExperience")}</option>
            {experiences.map(experience => (
              <option key={experience.id} value={experience.id}>
                {experience.title}, {experience.organisation}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset className="competence-picker">
        <legend>{t("statementForm.tags")}</legend>
        <p className="field__hint">{t("statementForm.tagsHint")}</p>
        <div className="competence-picker__options">
          {SORTED_COMPETENCES.map(competence => (
            <button
              key={competence.id}
              type="button"
              className={detectedIds.has(competence.id) ? "chip chip--detected" : "chip"}
              aria-pressed={tags.includes(competence.id)}
              onClick={() => toggleTag(competence.id)}
            >
              {competence.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form__actions">
        <button type="submit" className="button button--primary">
          {t("statementForm.save")}
        </button>
        <button type="button" className="button button--quiet" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
