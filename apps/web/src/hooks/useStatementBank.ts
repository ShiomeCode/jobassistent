// Live view of the user's statements and experiences. Re-renders when the database changes.

import { useLiveQuery } from "dexie-react-hooks";
import type { Experience, Statement } from "@jobassistent/core";
import { db } from "../db";

export interface StatementBank {
  statements: Statement[];
  experiences: Experience[];
  isLoading: boolean;
}

// Used on page: BankPage, ApplicationPage
export function useStatementBank(): StatementBank {
  const statements = useLiveQuery(() => db.statements.toArray(), []);
  const experiences = useLiveQuery(() => db.experiences.orderBy("kind").toArray(), []);
  return {
    statements: statements ?? [],
    experiences: experiences ?? [],
    isLoading: statements === undefined || experiences === undefined,
  };
}
