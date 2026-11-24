import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./analyze";
import type { Project, ScoredClaim } from "./types";

const fmt = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function templateNotice(project: Project, claim: ScoredClaim): string {
  const refs = claim.evidence.map((e) => `- ${e.recordId}: "${e.quote}"`).join("\n");
  return `${project.contractor}

${fmt(project.asAt)}

To: ${project.superintendent}
Project: ${project.name}

NOTICE OF CLAIM - ${claim.title.toUpperCase()}
${claim.clause}

1. The Contractor gives notice under ${claim.clause} of the Contract.

2. ${claim.summary}

3. The Contractor first became aware of the facts giving rise to this claim on or about ${fmt(claim.triggerDate)}.

4. The Contractor relies on the following records:
${refs}

5. The Contractor claims its entitlement under the Contract, including any adjustment to the Contract Sum and/or extension of time. Particulars of quantum and delay will be provided as soon as practicable and the Contractor reserves its right to update this claim.

Yours faithfully,

______________________
For and on behalf of ${project.contractor}`;
}

export async function draftNotice(project: Project, claim: ScoredClaim, apiKey = process.env.ANTHROPIC_API_KEY): Promise<string> {
  if (!apiKey) return templateNotice(project, claim);
  const client = new Anthropic({ apiKey });
  const sources = project.records.filter((r) => claim.sourceRecordIds.includes(r.id));
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system:
      "You are an Australian construction lawyer drafting a formal written notice of claim on behalf of a contractor to the Superintendent. Be precise, firm and professional. Cite the contract clauses and the project records relied on. Do not invent facts, amounts or dates not in the material; where quantum or delay is not yet known, state that particulars will follow and reserve rights. Output plain text only (no markdown).",
    messages: [
      {
        role: "user",
        content: `Draft the notice of claim.

Date of notice: ${project.asAt}
Contractor: ${project.contractor}
Principal: ${project.principal}
Superintendent: ${project.superintendent}
Project: ${project.name}
Contract: ${project.contractForm}
Special conditions:
${project.specialConditions}

Claim: ${claim.title}
Category: ${claim.category}
Clause: ${claim.clause}
Notice requirement: ${claim.noticeRequirement}
Trigger date: ${claim.triggerDate}
Summary: ${claim.summary}
Reasoning: ${claim.reasoning}

Source records:
${sources.map((r) => `[${r.id}] ${r.date} ${r.subject}\n${r.body}`).join("\n\n")}`,
      },
    ],
  });
  if (res.stop_reason === "max_tokens") throw new Error("The draft notice was cut off before it finished. Please try again.");
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
