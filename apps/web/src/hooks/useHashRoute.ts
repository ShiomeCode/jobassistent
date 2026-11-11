// Minimal hash routing (#bank, #import, #ansoegning, #ansoegninger, #backup) so reloading keeps the current page.

import { useEffect, useState } from "react";

export type Route = "bank" | "import" | "application" | "applications" | "backup";

const HASH_BY_ROUTE: Record<Route, string> = {
  bank: "#bank",
  import: "#import",
  application: "#ansoegning",
  applications: "#ansoegninger",
  backup: "#backup",
};

function readRoute(): Route {
  const matchingEntry = Object.entries(HASH_BY_ROUTE).find(([, hash]) => hash === window.location.hash);
  return (matchingEntry?.[0] as Route | undefined) ?? "bank";
}

export function getRouteHref(route: Route): string {
  return HASH_BY_ROUTE[route];
}

// Used on page: App
export function useHashRoute(): Route {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

export function navigateTo(route: Route): void {
  window.location.hash = HASH_BY_ROUTE[route];
}
