// Text lookup for the UI. All visible text goes through t() so new languages can be added later.

import { da, type TextKey } from "./da";

export type { TextKey };
export type TextBundle = Record<TextKey, string>;

const BUNDLES: Record<string, TextBundle> = { da };
const ACTIVE_LANGUAGE = "da";
/** Locale for dates and sorting. Follows the active language. */
export const ACTIVE_LOCALE = "da-DK";

/** Returns the UI text for a key, with {placeholders} replaced by the given values. */
export function t(key: TextKey, values: Record<string, string | number> = {}): string {
  const bundle = BUNDLES[ACTIVE_LANGUAGE] ?? da;
  return bundle[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
}

/** For keys built at runtime, e.g. `slot.${slot.id}`. Falls back to the key itself when it is missing. */
export function tDynamic(key: string, values: Record<string, string | number> = {}): string {
  return key in da ? t(key as TextKey, values) : key;
}

/** Formats a date the way it is written in a letter, e.g. "11. november 2026". */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(ACTIVE_LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(date);
}
