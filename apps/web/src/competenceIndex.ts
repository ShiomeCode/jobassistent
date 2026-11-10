// The competence dictionary is built once and shared by the whole app.

import { buildCompetenceIndex, DEFAULT_COMPETENCES } from "@jobassistent/core";

export const competenceIndex = buildCompetenceIndex();

/** Competences sorted by Danish label, for pickers. */
export const SORTED_COMPETENCES = [...DEFAULT_COMPETENCES].sort((first, second) =>
  first.label.localeCompare(second.label, "da"),
);
