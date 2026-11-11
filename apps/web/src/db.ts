// Local database in the browser (IndexedDB via Dexie). Nothing is sent to a server.

import Dexie, { type Table } from "dexie";
import type { Application, BankData, Experience, Profile, Statement } from "@jobassistent/core";

/** The profile is stored as a single row with this id. */
const PROFILE_ID = "me";

interface StoredProfile extends Profile {
  id: typeof PROFILE_ID;
}

class JobassistentDatabase extends Dexie {
  experiences!: Table<Experience, string>;
  statements!: Table<Statement, string>;
  applications!: Table<Application, string>;
  profile!: Table<StoredProfile, string>;

  constructor() {
    super("jobassistent");
    this.version(1).stores({
      experiences: "id, kind",
      statements: "id, type, experienceId",
      applications: "id, updatedAt",
    });
    // Version 2: contact details for exported applications.
    this.version(2).stores({
      profile: "id",
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

export async function saveApplication(application: Application): Promise<void> {
  await db.applications.put(application);
}

export async function deleteApplication(applicationId: string): Promise<void> {
  await db.applications.delete(applicationId);
}

/** Records that statements were used in an application, so the bank can show what is in use. */
export async function markStatementsAsUsed(statementIds: readonly string[], usedAt = new Date()): Promise<void> {
  const lastUsed = usedAt.toISOString();
  await db.statements.bulkUpdate(statementIds.map(statementId => ({ key: statementId, changes: { lastUsed } })));
}

export async function getProfile(): Promise<Profile | undefined> {
  const storedProfile = await db.profile.get(PROFILE_ID);
  if (!storedProfile) {
    return undefined;
  }
  const { id: _id, ...profile } = storedProfile;
  return profile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.profile.put({ ...profile, id: PROFILE_ID });
}

export async function readBank(): Promise<BankData> {
  const [experiences, statements, applications, profile] = await Promise.all([
    db.experiences.toArray(),
    db.statements.toArray(),
    db.applications.toArray(),
    getProfile(),
  ]);
  return profile ? { experiences, statements, applications, profile } : { experiences, statements, applications };
}

/** Replaces everything in the bank with the given data, in one transaction. */
export async function replaceBank(data: BankData): Promise<void> {
  await db.transaction("rw", [db.experiences, db.statements, db.applications, db.profile], async () => {
    await Promise.all([db.experiences.clear(), db.statements.clear(), db.applications.clear(), db.profile.clear()]);
    await db.experiences.bulkAdd(data.experiences);
    await db.statements.bulkAdd(data.statements);
    await db.applications.bulkAdd(data.applications);
    if (data.profile) {
      await db.profile.add({ ...data.profile, id: PROFILE_ID });
    }
  });
}
