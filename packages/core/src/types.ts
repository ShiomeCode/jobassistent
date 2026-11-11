// Shared data model for jobassistent.
// All data lives in the user's browser; these types describe what is stored and exported.

/** The user's own contact details, shown at the top of exported applications. */
export interface Profile {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type ExperienceKind = "job" | "education" | "volunteer" | "other";

/** A job, education or other experience that statements can be tied to. */
export interface Experience {
  id: string;
  kind: ExperienceKind;
  title: string;
  organisation: string;
  /** ISO date (yyyy-mm or yyyy-mm-dd). */
  from: string;
  /** ISO date. Empty when the experience is ongoing. */
  to?: string;
}

export type StatementType = "result" | "skill" | "personality" | "motivation";

/** One reusable sentence about the user, written in the user's own words. */
export interface Statement {
  id: string;
  experienceId?: string;
  type: StatementType;
  /** Full version of the sentence. */
  text: string;
  /** Optional shorter version for tight applications. */
  shortText?: string;
  /** Competence ids from the competence dictionary, added by the user. */
  tags: string[];
  /** ISO timestamp of the last time the statement was used in an application. */
  lastUsed?: string;
}

export type SlotKind = StatementType | "freetext";

export interface TemplateSlot {
  id: string;
  /** Key used by the UI to look up a translated label. */
  labelKey: string;
  /** Statement types that may fill the slot. Empty means free text only. */
  acceptedTypes: StatementType[];
  /** Max number of statements in the slot. */
  maxStatements: number;
  /** Whether the slot also has a free-text field. */
  hasFreeText: boolean;
}

export interface Template {
  id: string;
  labelKey: string;
  slots: TemplateSlot[];
}

export interface ApplicationSlotContent {
  statementIds: string[];
  freeText?: string;
  /** Text the user changed for this application only, by statement id. The bank keeps the original. */
  editedTexts?: Record<string, string>;
}

export interface Application {
  id: string;
  title: string;
  postingText: string;
  templateId: string;
  slots: Record<string, ApplicationSlotContent>;
  createdAt: string;
  updatedAt: string;
}

/** An entry in the competence dictionary: one competence with all the words that signal it. */
export interface Competence {
  id: string;
  /** Danish display label. */
  label: string;
  /** Words and phrases that signal the competence. Phrases may contain several words. */
  terms: string[];
}

export type PostingSection = "expectations" | "tasks" | "aboutUs" | "other";

/** One requirement or sentence extracted from a job posting. */
export interface Requirement {
  id: string;
  text: string;
  section: PostingSection;
  competenceIds: string[];
}
