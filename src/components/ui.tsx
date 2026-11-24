import type { ClaimCategory, RecordType, ScoredClaim } from "@/lib/types";

export const CATEGORY_LABEL: Record<ClaimCategory, string> = {
  variation: "Variation",
  extension_of_time: "Extension of time",
  latent_condition: "Latent condition",
  delay_costs: "Delay costs",
  suspension: "Suspension / restriction",
  other: "Other claim",
};

export const RECORD_LABEL: Record<RecordType, string> = {
  email: "Email",
  rfi: "RFI",
  tq: "TQ",
  site_diary: "Site diary",
  letter: "Letter",
  minutes: "Minutes",
  other: "Record",
};

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const STATUS_STYLE: Record<ScoredClaim["status"], string> = {
  expired: "bg-slate-200 text-slate-700 ring-slate-300",
  urgent: "bg-red-100 text-red-800 ring-red-300",
  soon: "bg-amber-100 text-amber-800 ring-amber-300",
  ok: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  prompt: "bg-orange-100 text-orange-800 ring-orange-300",
};

export function DeadlineBadge({ claim }: { claim: ScoredClaim }) {
  let text: string;
  if (claim.status === "prompt") text = "Notify promptly";
  else if (claim.status === "expired") text = `Deadline passed ${-(claim.daysRemaining ?? 0)}d ago`;
  else text = claim.daysRemaining === 0 ? "Due today" : `${claim.daysRemaining} days left`;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLE[claim.status]}`}>
      {text}
    </span>
  );
}
