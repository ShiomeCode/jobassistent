// Live list of saved applications, newest first.

import { useLiveQuery } from "dexie-react-hooks";
import type { Application } from "@jobassistent/core";
import { db } from "../db";

export interface SavedApplications {
  applications: Application[];
  isLoading: boolean;
}

// Used on page: ApplicationsPage
export function useSavedApplications(): SavedApplications {
  const applications = useLiveQuery(() => db.applications.orderBy("updatedAt").reverse().toArray(), []);
  return { applications: applications ?? [], isLoading: applications === undefined };
}
