// Text lookup for the UI. All visible text goes through t() so new languages can be added later.

import { da, type TextKey } from "./da";

export type { TextKey };
export type TextBundle = Record<TextKey, string>;

const BUNDLES: Record<string, TextBundle> = { da };
const ACTIVE_LANGUAGE = "da";

/** Returns the UI text for a key, with {placeholders} replaced by the given values. */
export function t(key: TextKey, values: Record<string, string | number> = {}): string {
  const bundle = BUNDLES[ACTIVE_LANGUAGE] ?? da;
  return bundle[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
}

/** For keys built at runtime, e.g. `slot.${slot.id}`. Falls back to the key itself when it is missing. */
export function tDynamic(key: string, values: Record<string, string | number> = {}): string {
  return key in da ? t(key as TextKey, values) : key;
}
