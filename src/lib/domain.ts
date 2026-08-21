/**
 * The shared vocabulary of the OS. Stages, statuses and their colours live
 * here so a deal stage means the same thing (and looks the same) on the
 * pipeline board, the account page and the dashboard.
 */

export type Option = {
  value: string;
  label: string;
  /** Tailwind-free token name resolved by `toneClass()` in the UI. */
  tone: Tone;
  hint?: string;
};

export type Tone =
  | "neutral"
  | "info"
  | "progress"
  | "warn"
  | "danger"
  | "success"
  | "accent";

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export const DEAL_STAGES: Option[] = [
  { value: "LEAD", label: "Lead", tone: "neutral", hint: "Identified, not yet worked" },
  { value: "QUALIFIED", label: "Qualified", tone: "info", hint: "Fit confirmed, budget signal" },
  { value: "PROPOSAL", label: "Proposal", tone: "progress", hint: "Scope and price sent" },
  { value: "NEGOTIATION", label: "Negotiation", tone: "warn", hint: "Terms in motion" },
  { value: "WON", label: "Won", tone: "success", hint: "Signed" },
  { value: "LOST", label: "Lost", tone: "danger", hint: "Closed without signature" },
];

export const OPEN_DEAL_STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"];

export const ACCOUNT_STATUSES: Option[] = [
  { value: "ACTIVE", label: "Active", tone: "success" },
  { value: "ONBOARDING", label: "Onboarding", tone: "info" },
  { value: "PAUSED", label: "Paused", tone: "warn" },
  { value: "CHURNED", label: "Churned", tone: "danger" },
];

export const ACCOUNT_KINDS: Option[] = [
  { value: "CLIENT", label: "Client", tone: "accent" },
  { value: "PROSPECT", label: "Prospect", tone: "info" },
  { value: "PARTNER", label: "Partner", tone: "progress" },
  { value: "INTERNAL", label: "Internal", tone: "neutral" },
];

export const ACCOUNT_TIERS: Option[] = [
  { value: "FOUNDING", label: "Founding", tone: "accent" },
  { value: "GROWTH", label: "Growth", tone: "info" },
  { value: "ENTERPRISE", label: "Enterprise", tone: "progress" },
];

export const DEAL_SOURCES: Option[] = [
  { value: "REFERRAL", label: "Referral", tone: "success" },
  { value: "INBOUND", label: "Inbound", tone: "info" },
  { value: "OUTBOUND", label: "Outbound", tone: "progress" },
  { value: "NETWORK", label: "Network", tone: "accent" },
  { value: "EXISTING", label: "Existing client", tone: "neutral" },
];

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export const TASK_STATUSES: Option[] = [
  { value: "BACKLOG", label: "Backlog", tone: "neutral" },
  { value: "TODO", label: "To do", tone: "info" },
  { value: "IN_PROGRESS", label: "In progress", tone: "progress" },
  { value: "BLOCKED", label: "Blocked", tone: "danger" },
  { value: "REVIEW", label: "Review", tone: "warn" },
  { value: "DONE", label: "Done", tone: "success" },
];

/** Column order for the pendientes board. */
export const TASK_BOARD_COLUMNS = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
] as const;

export const TASK_PRIORITIES: Option[] = [
  { value: "URGENT", label: "Urgent", tone: "danger" },
  { value: "HIGH", label: "High", tone: "warn" },
  { value: "MEDIUM", label: "Medium", tone: "info" },
  { value: "LOW", label: "Low", tone: "neutral" },
];

export const PRIORITY_RANK: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PROJECT_STATUSES: Option[] = [
  { value: "PLANNING", label: "Planning", tone: "neutral" },
  { value: "ACTIVE", label: "Active", tone: "progress" },
  { value: "BLOCKED", label: "Blocked", tone: "danger" },
  { value: "DONE", label: "Done", tone: "success" },
];

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const CONTENT_STAGES: Option[] = [
  { value: "IDEA", label: "Idea", tone: "neutral" },
  { value: "BRIEF", label: "Brief", tone: "info" },
  { value: "GENERATING", label: "Generating", tone: "progress" },
  { value: "REVIEW", label: "Review", tone: "warn" },
  { value: "APPROVED", label: "Approved", tone: "success" },
  { value: "SCHEDULED", label: "Scheduled", tone: "accent" },
  { value: "PUBLISHED", label: "Published", tone: "success" },
];

export const CONTENT_BOARD_COLUMNS = [
  "IDEA",
  "BRIEF",
  "GENERATING",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
] as const;

export const CONTENT_FORMATS: Option[] = [
  { value: "REEL", label: "Reel", tone: "accent" },
  { value: "POST", label: "Post", tone: "info" },
  { value: "CAROUSEL", label: "Carousel", tone: "progress" },
  { value: "STORY", label: "Story", tone: "warn" },
  { value: "VIDEO", label: "Video", tone: "accent" },
  { value: "UGC", label: "UGC", tone: "success" },
  { value: "STILL", label: "Still", tone: "neutral" },
];

export const CONTENT_CHANNELS: Option[] = [
  { value: "INSTAGRAM", label: "Instagram", tone: "accent" },
  { value: "TIKTOK", label: "TikTok", tone: "progress" },
  { value: "YOUTUBE", label: "YouTube", tone: "danger" },
  { value: "LINKEDIN", label: "LinkedIn", tone: "info" },
  { value: "WEB", label: "Web", tone: "neutral" },
  { value: "EMAIL", label: "Email", tone: "warn" },
];

export const ASSET_STAGES: Option[] = [
  { value: "RAW", label: "Raw", tone: "neutral", hint: "Straight off the shoot or Drive" },
  { value: "GENERATED", label: "Generated", tone: "progress", hint: "Produced by Higgsfield or Jockey" },
  { value: "APPROVED", label: "Approved", tone: "warn", hint: "Signed off, not final-cut" },
  { value: "FINAL", label: "Final", tone: "success", hint: "Ready to ship" },
  { value: "ARCHIVED", label: "Archived", tone: "neutral" },
];

export const ASSET_KINDS: Option[] = [
  { value: "IMAGE", label: "Image", tone: "info" },
  { value: "VIDEO", label: "Video", tone: "accent" },
  { value: "DOC", label: "Doc", tone: "neutral" },
  { value: "GUIDELINE", label: "Guideline", tone: "progress" },
  { value: "AUDIO", label: "Audio", tone: "warn" },
  { value: "OTHER", label: "Other", tone: "neutral" },
];

export const ASSET_SOURCES: Option[] = [
  { value: "DRIVE", label: "Google Drive", tone: "info" },
  { value: "JOCKEY", label: "Jockey", tone: "accent" },
  { value: "HIGGSFIELD", label: "Higgsfield", tone: "progress" },
  { value: "GITHUB", label: "GitHub", tone: "neutral" },
  { value: "FIGMA", label: "Figma", tone: "warn" },
  { value: "LOCAL", label: "Local", tone: "neutral" },
];

export const GUIDELINE_STATUSES: Option[] = [
  { value: "MISSING", label: "Missing", tone: "danger" },
  { value: "DRAFT", label: "Draft", tone: "warn" },
  { value: "REVIEW", label: "In review", tone: "progress" },
  { value: "DONE", label: "Done", tone: "success" },
];

export const PIPELINE_STATUSES: Option[] = [
  { value: "NOT_STARTED", label: "Not started", tone: "neutral" },
  { value: "IN_PROGRESS", label: "In progress", tone: "progress" },
  { value: "BLOCKED", label: "Blocked", tone: "danger" },
  { value: "DONE", label: "Done", tone: "success" },
];

export const INTEGRATION_STATUSES: Option[] = [
  { value: "CONNECTED", label: "Connected", tone: "success" },
  { value: "NEEDS_SETUP", label: "Needs setup", tone: "warn" },
  { value: "DEGRADED", label: "Degraded", tone: "warn" },
  { value: "ERROR", label: "Error", tone: "danger" },
  { value: "DISABLED", label: "Disabled", tone: "neutral" },
];

export const INTEGRATION_CATEGORIES: Option[] = [
  { value: "SOURCE", label: "Source of truth", tone: "info" },
  { value: "KNOWLEDGE", label: "Knowledge store", tone: "accent" },
  { value: "GENERATION", label: "Generation", tone: "progress" },
  { value: "AUTOMATION", label: "Automation", tone: "warn" },
  { value: "DESIGN", label: "Design", tone: "accent" },
  { value: "DELIVERY", label: "Delivery", tone: "success" },
  { value: "COMMS", label: "Comms", tone: "neutral" },
];

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const SERVICE_STATUSES: Option[] = [
  { value: "ACTIVE", label: "Active", tone: "success" },
  { value: "PAUSED", label: "Paused", tone: "neutral" },
];

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const COST_CATEGORIES: Option[] = [
  { value: "TOOLS", label: "Tools", tone: "info" },
  { value: "INFRA", label: "Infrastructure", tone: "accent" },
  { value: "OFFICE", label: "Office", tone: "neutral" },
  { value: "MARKETING", label: "Marketing", tone: "progress" },
  { value: "LEGAL", label: "Legal", tone: "warn" },
  { value: "OTHER", label: "Other", tone: "neutral" },
];

export const COST_RECURRENCE: Option[] = [
  { value: "MONTHLY", label: "Monthly", tone: "info" },
  { value: "YEARLY", label: "Yearly", tone: "accent" },
  { value: "ONE_TIME", label: "One-time", tone: "neutral" },
];

export const PAY_CADENCE: Option[] = [
  { value: "MONTHLY", label: "Monthly", tone: "info" },
  { value: "YEARLY", label: "Yearly", tone: "accent" },
];

/** Normalizes any Cost/Salary amount to a monthly figure for the P&L. */
export function toMonthly(amount: number, cadence: string): number {
  if (cadence === "YEARLY") return amount / 12;
  if (cadence === "ONE_TIME") return 0;
  return amount;
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function option(options: Option[], value: string | null | undefined): Option {
  return (
    options.find((o) => o.value === value) ?? {
      value: value ?? "—",
      label: value ? humanize(value) : "—",
      tone: "neutral",
    }
  );
}

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function labelOf(options: Option[], value: string | null | undefined): string {
  return option(options, value).label;
}
