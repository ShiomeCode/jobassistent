// Top bar with the app name and the main navigation.

import { getRouteHref, type Route } from "../hooks/useHashRoute";
import { t, type TextKey } from "../texts";

const NAV_ITEMS: { route: Route; labelKey: TextKey }[] = [
  { route: "bank", labelKey: "nav.bank" },
  { route: "application", labelKey: "nav.application" },
  { route: "applications", labelKey: "nav.applications" },
  { route: "backup", labelKey: "nav.backup" },
];

interface AppHeaderProps {
  currentRoute: Route;
}

// Used on page: App (shown on every page)
export function AppHeader({ currentRoute }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="app-header__brand" href={getRouteHref("bank")}>
          {t("app.name")}
        </a>
        <nav aria-label={t("nav.label")}>
          <ul className="app-header__nav">
            {NAV_ITEMS.map(item => (
              <li key={item.route}>
                <a href={getRouteHref(item.route)} aria-current={item.route === currentRoute ? "page" : undefined}>
                  {t(item.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
