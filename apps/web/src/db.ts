// Local database in the browser (IndexedDB via Dexie). Nothing is sent to a server.

import Dexie, { type Table } from "dexie";
import type { Application, BankData, Experience, Statement } from "@jobassistent/core";

class JobassistentDatabase extends Dexie {
  experiences!: Table<Experience, string>;
  statements!: Table<Statement, string>;
  applications!: Table<Application, string>;

  constructor() {
    super("jobassistent");
    this.version(1).stores({
      experiences: "id, kind",
      statements: "id, type, experienceId",
      applications: "id, updatedAt",
    });
  }
}

export const db = new JobassistentDatabase();

export function createId(): string {
  return crypto.randomUUID();
}

export async function saveStatement(statement: Statement): Promise<void> {
  await db.statements.put(statement);
}

export async function deleteStatement(statementId: string): Promise<void> {
  await db.statements.delete(statementId);
}

export async function saveExperience(experience: Experience): Promise<void> {
  await db.experiences.put(experience);
}

/** Deletes an experience and unlinks the statements that pointed to it. */
export async function deleteExperience(experienceId: string): Promise<void> {
  await db.transaction("rw", db.experiences, db.statements, async () => {
    await db.experiences.delete(experienceId);
    await db.statements.where("experienceId").equals(experienceId).modify(statement => {
      delete statement.experienceId;
    });
  });
}

export async function readBank(): Promise<BankData> {
  const [experiences, statements, applications] = await Promise.all([
    db.experiences.toArray(),
    db.statements.toArray(),
    db.applications.toArray(),
  ]);
  return { experiences, statements, applications };
}

/** Replaces everything in the bank with the given data, in one transaction. */
export async function replaceBank(data: BankData): Promise<void> {
  await db.transaction("rw", db.experiences, db.statements, db.applications, async () => {
    await Promise.all([db.experiences.clear(), db.statements.clear(), db.applications.clear()]);
    await db.experiences.bulkAdd(data.experiences);
    await db.statements.bulkAdd(data.statements);
    await db.applications.bulkAdd(data.applications);
  });
}
