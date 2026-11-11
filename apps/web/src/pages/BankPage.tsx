// The statement bank: all the user's statements grouped by type, plus their experiences.

import { useState } from "react";
import type { Statement, StatementType } from "@jobassistent/core";
import { useStatementBank } from "../hooks/useStatementBank";
import { deleteExperience, deleteStatement, saveExperience, saveStatement } from "../db";
import { StatementCard } from "../components/StatementCard";
import { StatementForm } from "../components/StatementForm";
import { ExperienceList } from "../components/ExperienceList";
import { ProfileForm } from "../components/ProfileForm";
import { getRouteHref } from "../hooks/useHashRoute";
import { t, tDynamic } from "../texts";

const TYPE_ORDER: StatementType[] = ["result", "skill", "personality", "motivation"];

type FormState = { mode: "closed" } | { mode: "new" } | { mode: "edit"; statement: Statement };

// Used on page: App (route "bank")
export function BankPage() {
  const { statements, experiences, isLoading } = useStatementBank();
  const [formState, setFormState] = useState<FormState>({ mode: "closed" });

  const experienceTitleById = new Map(experiences.map(experience => [experience.id, experience.title]));
  const statementGroups = TYPE_ORDER.map(type => ({
    type,
    statements: statements.filter(statement => statement.type === type),
  })).filter(group => group.statements.length > 0);

  const handleSaveStatement = async (statement: Statement) => {
    await saveStatement(statement);
    setFormState({ mode: "closed" });
  };

  return (
    <div className="page bank-page">
      <div className="page__intro">
        <h1>{t("bank.heading")}</h1>
        <p>{t("bank.intro")}</p>
      </div>

      <div className="bank-page__layout">
        <div className="bank-page__statements">
          {formState.mode === "closed" ? (
            <div className="bank-page__toolbar">
              <button type="button" className="button button--primary" onClick={() => setFormState({ mode: "new" })}>
                {t("bank.addStatement")}
              </button>
              <a className="button button--secondary" href={getRouteHref("import")}>
                {t("bank.importCv")}
              </a>
              {statements.length > 0 && <span className="muted">{t("bank.statementCount", { count: statements.length })}</span>}
            </div>
          ) : (
            <StatementForm
              key={formState.mode === "edit" ? formState.statement.id : "new"}
              initialStatement={formState.mode === "edit" ? formState.statement : undefined}
              experiences={experiences}
              onSave={handleSaveStatement}
              onCancel={() => setFormState({ mode: "closed" })}
            />
          )}

          {!isLoading && statements.length === 0 && formState.mode === "closed" && (
            <p className="empty-state">{t("bank.empty")}</p>
          )}

          {statementGroups.map(group => (
            <section key={group.type} className="statement-group" aria-labelledby={`group-${group.type}`}>
              <h2 id={`group-${group.type}`}>{tDynamic(`statementType.${group.type}`)}</h2>
              <div className="statement-group__cards">
                {group.statements.map(statement => (
                  <StatementCard
                    key={statement.id}
                    statement={statement}
                    experienceTitle={statement.experienceId ? experienceTitleById.get(statement.experienceId) : undefined}
                    onEdit={statementToEdit => setFormState({ mode: "edit", statement: statementToEdit })}
                    onDelete={deleteStatement}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="bank-page__sidebar">
          <ExperienceList experiences={experiences} onSave={saveExperience} onDelete={deleteExperience} />
          <ProfileForm />
        </aside>
      </div>
    </div>
  );
}
