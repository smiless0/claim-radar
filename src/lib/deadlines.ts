import type { DetectedClaim, ScoredClaim } from "./types";

const DAY_MS = 86_400_000;
const toUtc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

export function localIsoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);
}

export function scoreClaim(claim: DetectedClaim, asAt: string): ScoredClaim {
  if (claim.noticeDays == null) {
    return { ...claim, deadline: null, daysRemaining: null, status: "prompt" };
  }
  const deadline = addDays(claim.triggerDate, claim.noticeDays);
  const daysRemaining = daysBetween(asAt, deadline);
  const status = daysRemaining < 0 ? "expired" : daysRemaining <= 7 ? "urgent" : daysRemaining <= 14 ? "soon" : "ok";
  return { ...claim, deadline, daysRemaining, status };
}

const ORDER = { urgent: 0, prompt: 1, soon: 2, ok: 3, expired: 4 } as const;

export function sortClaims(claims: ScoredClaim[]): ScoredClaim[] {
  return [...claims].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0)
  );
}
