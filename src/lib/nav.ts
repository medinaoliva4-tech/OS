import type { IconName } from "@/components/ui/Icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Shown in the command palette to explain what the screen is for. */
  hint: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Minimalist nav (2026-08-24, per Rodrigo): only what he checks day to day.
 * Pipeline/Contacts/Services/Content/Calendar/Assets/Connections live on in
 * the app and stay reachable by direct URL — they're just not in the primary
 * nav or command palette anymore. Team/Settings stay reachable via UserMenu.
 */
export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: "dashboard",
        hint: "Everything at a glance — revenue, work in flight, what is late",
      },
    ],
  },
  {
    title: "Revenue",
    items: [
      {
        href: "/accounts",
        label: "Brands",
        icon: "accounts",
        hint: "Every client brand and its workspace — flujos por cliente",
      },
      {
        href: "/finance",
        label: "Finance",
        icon: "finance",
        hint: "Costs, pay, and reinvestments",
      },
    ],
  },
  {
    title: "Production",
    items: [
      {
        href: "/tasks",
        label: "Pendientes",
        icon: "tasks",
        hint: "The board — everything outstanding, by brand and owner",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV.flatMap((group) => group.items);

/** Longest-prefix match so /accounts/nao highlights "Brands". */
export function activeHref(pathname: string): string {
  if (pathname === "/") return "/";

  const matches = ALL_NAV_ITEMS.filter(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  ).sort((a, b) => b.href.length - a.href.length);

  return matches[0]?.href ?? pathname;
}
