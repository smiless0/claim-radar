"use client";
import { useState } from "react";
import type { ProjectRecord, ScoredClaim } from "@/lib/types";
import { CATEGORY_LABEL, DeadlineBadge, fmtDate } from "./ui";

export function ClaimCard({
  claim,
  records,
  onDraft,
  onShowRecord,
}: {
  claim: ScoredClaim;
  records: ProjectRecord[];
  onDraft: (c: ScoredClaim) => void;
  onShowRecord: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="claim-card" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">{CATEGORY_LABEL[claim.category]}</span>
            <span className="text-slate-500">{claim.confidence} confidence</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900">{claim.title}</h3>
        </div>
        <DeadlineBadge claim={claim} />
      </div>

      <p className="mt-2 text-sm text-slate-700">{claim.summary}</p>

      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Clause</dt>
          <dd className="font-medium">{claim.clause}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Trigger date</dt>
          <dd className="font-medium">{fmtDate(claim.triggerDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Notice deadline</dt>
          <dd className="font-medium">{claim.deadline ? fmtDate(claim.deadline) : "Promptly"}</dd>
        </div>
      </dl>

      {claim.status === "expired" && (
        <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
          The notice period appears to have passed. The claim may be time-barred: consider notifying immediately and getting advice on waiver, estoppel or the Superintendent&apos;s discretion.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Source records:</span>
        {claim.sourceRecordIds.map((id) => (
          <button
            key={id}
            onClick={() => onShowRecord(id)}
            className="rounded border border-slate-300 px-2 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-100"
          >
            {id}
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
          <p className="text-slate-600"><span className="font-medium text-slate-800">Notice requirement: </span>{claim.noticeRequirement}</p>
          <p className="text-slate-600"><span className="font-medium text-slate-800">Reasoning: </span>{claim.reasoning}</p>
          {claim.evidence.map((e, i) => (
            <blockquote key={i} className="border-l-2 border-indigo-300 pl-3 text-slate-600 italic">
              &ldquo;{e.quote}&rdquo; <span className="not-italic font-mono text-xs text-slate-400">({e.recordId}{records.find((r) => r.id === e.recordId) ? `, ${fmtDate(records.find((r) => r.id === e.recordId)!.date)}` : ""})</span>
            </blockquote>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => onDraft(claim)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
          Draft notice
        </button>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          {open ? "Hide reasoning" : "Evidence & reasoning"}
        </button>
      </div>
    </div>
  );
}
