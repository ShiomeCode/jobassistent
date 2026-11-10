// Export and import of the user's statement bank as a JSON backup file.

import type { Application, Experience, ExperienceKind, Statement, StatementType } from "./types";

export const BANK_EXPORT_FORMAT = "jobassistent-bank";
export const BANK_EXPORT_VERSION = 1;

export interface BankData {
  experiences: Experience[];
  statements: Statement[];
  applications: Application[];
}

export interface BankExport extends BankData {
  format: typeof BANK_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
}

export type ParseResult<T> = { isValid: true; value: T } | { isValid: false; error: string };

const EXPERIENCE_KINDS: readonly ExperienceKind[] = ["job", "education", "volunteer", "other"];
const STATEMENT_TYPES: readonly StatementType[] = ["result", "skill", "personality", "motivation"];

export function createBankExport(data: BankData, now = new Date()): BankExport {
  return { format: BANK_EXPORT_FORMAT, version: BANK_EXPORT_VERSION, exportedAt: now.toISOString(), ...data };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isExperience(value: unknown): value is Experience {
  return (
    isRecord(value) &&
    isString(value.id) &&
    EXPERIENCE_KINDS.includes(value.kind as ExperienceKind) &&
    isString(value.title) &&
    isString(value.organisation) &&
    isString(value.from) &&
    isOptionalString(value.to)
  );
}

function isStatement(value: unknown): value is Statement {
  return (
    isRecord(value) &&
    isString(value.id) &&
    STATEMENT_TYPES.includes(value.type as StatementType) &&
    isString(value.text) &&
    isOptionalString(value.shortText) &&
    isOptionalString(value.experienceId) &&
    Array.isArray(value.tags) &&
    value.tags.every(isString)
  );
}

function isApplication(value: unknown): value is Application {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.postingText) &&
    isString(value.templateId) &&
    isRecord(value.slots) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

/** Validates an imported backup. Never trusts the file: every item is checked. */
export function parseBankExport(input: unknown): ParseResult<BankData> {
  if (!isRecord(input) || input.format !== BANK_EXPORT_FORMAT) {
    return { isValid: false, error: "notABankFile" };
  }
  if (typeof input.version !== "number" || input.version > BANK_EXPORT_VERSION) {
    return { isValid: false, error: "unsupportedVersion" };
  }
  const { experiences = [], statements = [], applications = [] } = input;
  if (!Array.isArray(experiences) || !experiences.every(isExperience)) {
    return { isValid: false, error: "invalidExperiences" };
  }
  if (!Array.isArray(statements) || !statements.every(isStatement)) {
    return { isValid: false, error: "invalidStatements" };
  }
  if (!Array.isArray(applications) || !applications.every(isApplication)) {
    return { isValid: false, error: "invalidApplications" };
  }
  return { isValid: true, value: { experiences, statements, applications } };
}
