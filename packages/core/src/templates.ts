// Built-in application templates. Labels are translation keys; the UI owns the actual text.

import type { Template } from "./types";

export const DEFAULT_TEMPLATE: Template = {
  id: "standard",
  labelKey: "template.standard",
  slots: [
    { id: "opening", labelKey: "slot.opening", acceptedTypes: [], maxStatements: 0, hasFreeText: true },
    { id: "motivation", labelKey: "slot.motivation", acceptedTypes: ["motivation"], maxStatements: 1, hasFreeText: true },
    { id: "evidence", labelKey: "slot.evidence", acceptedTypes: ["result", "skill"], maxStatements: 3, hasFreeText: false },
    { id: "personality", labelKey: "slot.personality", acceptedTypes: ["personality"], maxStatements: 1, hasFreeText: false },
    { id: "closing", labelKey: "slot.closing", acceptedTypes: [], maxStatements: 0, hasFreeText: true },
  ],
};

export const BUILT_IN_TEMPLATES: readonly Template[] = [DEFAULT_TEMPLATE];
