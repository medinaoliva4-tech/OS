/**
 * The content system, as a chain of checkpoints.
 *
 * This is the PENDIENTES list turned into a machine. Every brand gets the same
 * eight hops, so "where is NAO stuck?" is answerable at a glance instead of by
 * reading a chat thread. `toolKey` ties each hop to a row in Connections, so a
 * broken pipe and a stalled brand point at the same place.
 */

export type PipelineStepBlueprint = {
  key: string;
  label: string;
  toolKey: string;
  note: string;
};

export const CONTENT_PIPELINE: PipelineStepBlueprint[] = [
  {
    key: "guidelines",
    label: "Guidelines finished",
    toolKey: "github",
    note: "Brand guidelines complete and committed to the brand's content-system folder.",
  },
  {
    key: "drive_to_jockey",
    label: "Drive → Jockey ingest",
    toolKey: "jockey",
    note: "All photos and video moved out of Google Drive into the Jockey knowledge store.",
  },
  {
    key: "brand_calendar",
    label: "Brand calendar in Cowork",
    toolKey: "cowork",
    note: "Per-brand publishing calendar built and agreed.",
  },
  {
    key: "jockey_to_higgsfield",
    label: "Jockey → Higgsfield",
    toolKey: "higgsfield",
    note: "Reference stills pushed from Jockey into Higgsfield via the generation skill.",
  },
  {
    key: "approved_folder",
    label: "Approved / generated filed",
    toolKey: "jockey",
    note: "Generated output sorted into the approved and generated folders in Jockey.",
  },
  {
    key: "assets_final",
    label: "Final assets locked",
    toolKey: "jockey",
    note: "Final cut assets signed off and marked FINAL.",
  },
  {
    key: "zapier_to_github",
    label: "Zapier → GitHub sync",
    toolKey: "zapier",
    note: "Zapier pushes the whole content-system folder to the brand's GitHub repo.",
  },
  {
    key: "design_handoff",
    label: "Repo → design handoff",
    toolKey: "figma",
    note: "Claude Code designs from the repo with full brand context and assets.",
  },
  {
    key: "scheduled",
    label: "Scheduled & programmed",
    toolKey: "cowork",
    note: "Everything calendarised and queued to publish.",
  },
];

export const GUIDELINE_SECTIONS = [
  "Positioning & promise",
  "Tone of voice",
  "Logo & lockups",
  "Colour system",
  "Typography",
  "Photography direction",
  "Motion & edit rules",
  "Do / don't",
] as const;
