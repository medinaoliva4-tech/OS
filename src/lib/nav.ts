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
 * Navigation is grouped by the question each screen answers, not by data
 * model. "Revenue" is where you go when you want to know what money is doing;
 * "Production" is where you go when you want to know what is being made.
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
        hint: "Every client brand and its workspace",
      },
      {
        href: "/pipeline",
        label: "Pipeline",
        icon: "pipeline",
        hint: "Deals by stage and weighted forecast",
      },
      {
        href: "/contacts",
        label: "Contacts",
        icon: "contacts",
        hint: "People at client brands",
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
        href: "/services",
        label: "Services",
        icon: "services",
        hint: "The lines of work the agency sells, and who runs each one",
      },
      {
        href: "/tasks",
        label: "Pendientes",
        icon: "tasks",
        hint: "The board — everything outstanding, by brand and owner",
      },
      {
        href: "/content",
        label: "Content",
        icon: "content",
        hint: "The pipeline from idea to published",
      },
      {
        href: "/calendar",
        label: "Calendar",
        icon: "calendar",
        hint: "Publishing calendar, filterable by brand",
      },
      {
        href: "/assets",
        label: "Assets",
        icon: "assets",
        hint: "Raw, generated, approved and final files with where they live",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/connections",
        label: "Connections",
        icon: "connections",
        hint: "Drive, Jockey, Higgsfield, GitHub, Zapier — status of every pipe",
      },
      {
        href: "/team",
        label: "Team",
        icon: "team",
        hint: "Who has access, and inviting new @inherentglobal.com people",
      },
      {
        href: "/settings",
        label: "Settings",
        icon: "settings",
        hint: "Workspace policy, brand tokens and environment",
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
