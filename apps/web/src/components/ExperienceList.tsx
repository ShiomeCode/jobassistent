// Sidebar list of the user's experiences, with an inline form to add more.

import { useState } from "react";
import type { Experience } from "@jobassistent/core";
import { ExperienceForm } from "./ExperienceForm";
import { t, tDynamic } from "../texts";

interface ExperienceListProps {
  experiences: Experience[];
  onSave: (experience: Experience) => void;
  onDelete: (experienceId: string) => void;
}

function formatPeriod(experience: Experience): string {
  const fromYear = experience.from.slice(0, 4);
  const toYear = experience.to ? experience.to.slice(0, 4) : t("experiences.present");
  return fromYear === toYear ? fromYear : `${fromYear}–${toYear}`;
}

// Used on page: BankPage
export function ExperienceList({ experiences, onSave, onDelete }: ExperienceListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string>();

  const handleSave = (experience: Experience) => {
    onSave(experience);
    setIsAdding(false);
  };

  return (
    <section className="experience-list" aria-labelledby="experiences-heading">
      <h2 id="experiences-heading">{t("experiences.heading")}</h2>

      {experiences.length === 0 && !isAdding && <p className="muted">{t("experiences.empty")}</p>}

      <ul className="experience-list__items">
        {experiences.map(experience => (
          <li key={experience.id} className="experience-list__item">
            <span className="experience-list__title">{experience.title}</span>
            <span className="experience-list__meta">
              {experience.organisation}, {formatPeriod(experience)}
            </span>
            <span className="experience-list__kind">{tDynamic(`experienceKind.${experience.kind}`)}</span>
            {confirmingDeleteId === experience.id ? (
              <span className="experience-list__actions">
                <button type="button" className="button button--danger button--small" onClick={() => onDelete(experience.id)}>
                  {t("common.confirmDelete")}
                </button>
                <button type="button" className="button button--quiet button--small" onClick={() => setConfirmingDeleteId(undefined)}>
                  {t("common.cancel")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="button button--quiet button--small experience-list__actions"
                onClick={() => setConfirmingDeleteId(experience.id)}
              >
                {t("common.delete")}
              </button>
            )}
          </li>
        ))}
      </ul>

      {isAdding ? (
        <ExperienceForm onSave={handleSave} onCancel={() => setIsAdding(false)} />
      ) : (
        <button type="button" className="button button--secondary" onClick={() => setIsAdding(true)}>
          {t("experiences.add")}
        </button>
      )}
    </section>
  );
}
