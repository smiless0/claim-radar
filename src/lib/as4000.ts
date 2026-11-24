// Default notice provisions for AS 4000-1997 General Conditions.
// These are starting-point defaults only: special conditions frequently amend
// them, and every result must be checked against the executed contract.
export interface NoticeRule {
  key: string;
  clause: string;
  appliesTo: string;
  requirement: string;
  days: number | null;
}

export const AS4000_RULES: NoticeRule[] = [
  {
    key: "latent_condition",
    clause: "AS 4000 cl 25.1",
    appliesTo: "Latent conditions (physical conditions on or near the site differing materially from what a competent contractor should reasonably have anticipated at the date of tender)",
    requirement: "Written notice to the Superintendent promptly and, where possible, before the condition is disturbed.",
    days: null,
  },
  {
    key: "extension_of_time_notice",
    clause: "AS 4000 cl 34.2",
    appliesTo: "Delay notification - when it becomes evident the contractor will be delayed in reaching practical completion",
    requirement: "Promptly notify the Superintendent in writing of the cause and estimated delay.",
    days: null,
  },
  {
    key: "extension_of_time",
    clause: "AS 4000 cl 34.3",
    appliesTo: "Claim for extension of time for a qualifying cause of delay (e.g. act, default or omission of the Principal or Superintendent, late documents/directions, variations, latent conditions)",
    requirement: "Written claim for EOT, with evidence of the facts, within 28 days after the delay occurs.",
    days: 28,
  },
  {
    key: "variation",
    clause: "AS 4000 cl 36 / cl 41.1",
    appliesTo: "Direction by the Superintendent (incl. informal or verbal direction, or a response to an RFI/TQ) that changes the scope, quality, or character of the work",
    requirement: "Written notice of the claim (general basis and quantum) within 28 days after the contractor first knew or should reasonably have known of the facts giving rise to the claim.",
    days: 28,
  },
  {
    key: "delay_costs",
    clause: "AS 4000 cl 34.9 / cl 41.1",
    appliesTo: "Delay damages / prolongation costs for compensable delay",
    requirement: "Written notice of the claim within 28 days after the contractor first knew or should reasonably have known of the facts.",
    days: 28,
  },
  {
    key: "suspension",
    clause: "AS 4000 cl 33 / cl 41.1",
    appliesTo: "Suspension directed by the Superintendent not caused by the contractor",
    requirement: "Written notice of claim for extra costs within 28 days after the contractor first knew or should reasonably have known of the facts.",
    days: 28,
  },
  {
    key: "other",
    clause: "AS 4000 cl 41.1",
    appliesTo: "Any other claim arising under or in connection with the contract (incl. breach)",
    requirement: "Written notice of the claim within 28 days after the contractor first knew or should reasonably have known of the facts.",
    days: 28,
  },
];

export function rulesAsText(): string {
  return AS4000_RULES.map(
    (r) => `- ${r.clause} [${r.key}] - ${r.appliesTo}. Requirement: ${r.requirement} Default days: ${r.days ?? "promptly (no fixed number)"}`
  ).join("\n");
}
