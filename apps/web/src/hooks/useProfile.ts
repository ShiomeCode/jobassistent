// Live view of the user's contact details. Re-renders when they change.

import { useLiveQuery } from "dexie-react-hooks";
import type { Profile } from "@jobassistent/core";
import { getProfile } from "../db";

export interface ProfileState {
  profile: Profile | undefined;
  isLoading: boolean;
}

// Used on page: BankPage (inside ProfileForm), ApplicationPage
export function useProfile(): ProfileState {
  // useLiveQuery returns undefined while loading, so wrap the result to tell "loading" from "no profile".
  const result = useLiveQuery(async () => ({ profile: await getProfile() }), []);
  return { profile: result?.profile, isLoading: result === undefined };
}
