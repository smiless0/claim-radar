export type RecordType = "email" | "rfi" | "tq" | "site_diary" | "letter" | "minutes" | "other";

export interface ProjectRecord {
  id: string;
  type: RecordType;
  date: string; // ISO yyyy-mm-dd
  from?: string;
  to?: string;
  subject: string;
  body: string;
}

export interface Project {
  name: string;
  contractor: string;
  principal: string;
  superintendent: string;
  contractForm: string;
  asAt: string; // ISO date the review is performed as at
  specialConditions: string;
  records: ProjectRecord[];
}

export type ClaimCategory =
  | "variation"
  | "extension_of_time"
  | "latent_condition"
  | "delay_costs"
  | "suspension"
  | "other";

export interface DetectedClaim {
  id: string;
  category: ClaimCategory;
  title: string;
  summary: string;
  triggerDate: string; // ISO date the contractor knew / should have known
  sourceRecordIds: string[];
  evidence: { recordId: string; quote: string }[];
  clause: string; // e.g. "AS 4000 cl 34.3 (as amended by SC 4)"
  noticeRequirement: string;
  noticeDays: number | null; // calendar days after triggerDate; null = "promptly"
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface ScoredClaim extends DetectedClaim {
  deadline: string | null;
  daysRemaining: number | null;
  status: "expired" | "urgent" | "soon" | "ok" | "prompt";
}

export interface AnalysisResult {
  asAt: string;
  claims: ScoredClaim[];
  model: string;
  cached: boolean;
}
