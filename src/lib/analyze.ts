import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { rulesAsText } from "./as4000";
import { scoreClaim, sortClaims } from "./deadlines";
import type { AnalysisResult, DetectedClaim, Project } from "./types";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const ClaimSchema = z.object({
  category: z.enum(["variation", "extension_of_time", "latent_condition", "delay_costs", "suspension", "other"]),
  title: z.string(),
  summary: z.string(),
  triggerDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceRecordIds: z.array(z.string()).min(1),
  evidence: z.array(z.object({ recordId: z.string(), quote: z.string() })),
  clause: z.string(),
  noticeRequirement: z.string(),
  noticeDays: z.number().int().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string(),
});

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_claims",
  description: "Report every potential contractor claim found in the project records.",
  input_schema: {
    type: "object",
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["variation", "extension_of_time", "latent_condition", "delay_costs", "suspension", "other"] },
            title: { type: "string", description: "Short title, e.g. 'Variation - extra GPOs in consult rooms'" },
            summary: { type: "string", description: "2-3 sentences: what happened and why it may give the contractor an entitlement" },
            triggerDate: { type: "string", description: "ISO date (yyyy-mm-dd) from which the notice period runs under the applicable clause" },
            sourceRecordIds: { type: "array", items: { type: "string" } },
            evidence: {
              type: "array",
              items: {
                type: "object",
                properties: { recordId: { type: "string" }, quote: { type: "string", description: "Verbatim quote from the record" } },
                required: ["recordId", "quote"],
              },
            },
            clause: { type: "string", description: "Applicable clause(s), noting any special condition amendment" },
            noticeRequirement: { type: "string", description: "What notice must be given, in what form, by when" },
            noticeDays: { type: ["integer", "null"], description: "Calendar days after triggerDate to give notice, after applying special conditions. null if the requirement is 'promptly'." },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            reasoning: { type: "string", description: "Why this is a claim and how the trigger date and time limit were determined" },
          },
          required: ["category", "title", "summary", "triggerDate", "sourceRecordIds", "evidence", "clause", "noticeRequirement", "noticeDays", "confidence", "reasoning"],
        },
      },
    },
    required: ["claims"],
  },
};

const SYSTEM = `You are an experienced Australian construction lawyer acting for the CONTRACTOR. Your job is to review project records and spot every event that may give the contractor a valid claim (variation, extension of time, latent condition, delay costs, suspension or other entitlement), so that notices are not missed and claims are not time-barred.

Rules:
- Only flag events that may give the CONTRACTOR an entitlement against the Principal. Ignore matters that are the contractor's own risk (e.g. its subcontractors' labour shortages, defects directed for rectification at the contractor's cost, weather within the contractual allowance, routine clarifications that confirm the existing scope).
- Informal directions (emails, verbal instructions, RFI/TQ responses) that change scope are potential variations even if no formal variation order was issued.
- Group records that relate to the same event into ONE claim. Raise separate claims where different entitlements arise (e.g. a latent condition and a separate EOT for the late RFI).
- Determine the trigger date as the applicable clause specifies (e.g. EOT: the date the delay occurs; cl 41: the date the contractor first knew or should reasonably have known of the facts).
- ALWAYS apply the special conditions: they override the general conditions (e.g. a shortened time bar).
- Evidence quotes must be verbatim extracts from the records.
- Do not flag events occurring after the review date.`;

export async function analyzeProject(project: Project, apiKey = process.env.ANTHROPIC_API_KEY): Promise<AnalysisResult> {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

  const records = project.records
    .map((r) => `<record id="${r.id}" type="${r.type}" date="${r.date}"${r.from ? ` from="${r.from}"` : ""}${r.to ? ` to="${r.to}"` : ""}>\nSubject: ${r.subject}\n${r.body}\n</record>`)
    .join("\n\n");

  const user = `Project: ${project.name}
Contractor: ${project.contractor}
Principal: ${project.principal}
Superintendent: ${project.superintendent}
Contract: ${project.contractForm}
Review date (today): ${project.asAt}

<general_conditions_notice_provisions>
${rulesAsText()}
</general_conditions_notice_provisions>

<special_conditions>
${project.specialConditions || "None provided."}
</special_conditions>

<project_records>
${records}
</project_records>

Review every record and call report_claims with all potential contractor claims.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: REPORT_TOOL.name },
    messages: [{ role: "user", content: user }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Model did not return claims");
  const parsed = z.object({ claims: z.array(ClaimSchema) }).parse(block.input);
  const detected: DetectedClaim[] = parsed.claims.map((c, i) => ({ ...c, id: `C${i + 1}` }));
  return toResult(detected, project.asAt, false);
}

export function toResult(detected: DetectedClaim[], asAt: string, cached: boolean): AnalysisResult {
  return { asAt, claims: sortClaims(detected.map((c) => scoreClaim(c, asAt))), model: MODEL, cached };
}
