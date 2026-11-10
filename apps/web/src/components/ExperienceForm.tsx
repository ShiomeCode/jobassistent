// Form for adding a job, education or other experience.

import { useState, type FormEvent } from "react";
import type { Experience, ExperienceKind } from "@jobassistent/core";
import { createId } from "../db";
import { t, tDynamic } from "../texts";

const EXPERIENCE_KINDS: ExperienceKind[] = ["job", "education", "volunteer", "other"];

interface ExperienceFormProps {
  onSave: (experience: Experience) => void;
  onCancel: () => void;
}

// Used on page: BankPage (inside ExperienceList)
export function ExperienceForm({ onSave, onCancel }: ExperienceFormProps) {
  const [kind, setKind] = useState<ExperienceKind>("job");
  const [title, setTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  const isIncomplete = [title, organisation, from].some(value => value.trim().length === 0);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setHasTriedToSave(true);
    if (isIncomplete) {
      return;
    }
    onSave({
      id: createId(),
      kind,
      title: title.trim(),
      organisation: organisation.trim(),
      from,
      to: to || undefined,
    });
  };

  return (
    <form className="experience-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">{t("experienceForm.kind")}</span>
        <select value={kind} onChange={event => setKind(event.target.value as ExperienceKind)}>
          {EXPERIENCE_KINDS.map(experienceKind => (
            <option key={experienceKind} value={experienceKind}>
              {tDynamic(`experienceKind.${experienceKind}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">{t("experienceForm.title")}</span>
        <input
          type="text"
          value={title}
          placeholder={t("experienceForm.titlePlaceholder")}
          onChange={event => setTitle(event.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">{t("experienceForm.organisation")}</span>
        <input type="text" value={organisation} onChange={event => setOrganisation(event.target.value)} />
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field__label">{t("experienceForm.from")}</span>
          <input type="month" value={from} onChange={event => setFrom(event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">{t("experienceForm.to")}</span>
          <input type="month" value={to} onChange={event => setTo(event.target.value)} />
        </label>
      </div>
      {hasTriedToSave && isIncomplete && <p className="field__error">{t("experienceForm.required")}</p>}
      <div className="form__actions">
        <button type="submit" className="button button--primary">
          {t("experienceForm.save")}
        </button>
        <button type="button" className="button button--quiet" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
