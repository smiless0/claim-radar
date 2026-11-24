"use client";
import { useRef, useState } from "react";
import sample from "@/data/sample-project.json";
import type { AnalysisResult, Project, ScoredClaim } from "@/lib/types";
import { filesToRecords } from "@/lib/upload";
import { localIsoDate } from "@/lib/deadlines";
import { ClaimCard } from "@/components/ClaimCard";
import { Modal } from "@/components/Modal";
import { RECORD_LABEL, fmtDate } from "@/components/ui";

const EMPTY: Project = {
  name: "My project",
  contractor: "Contractor",
  principal: "Principal",
  superintendent: "Superintendent",
  contractForm: "AS 4000-1997 General Conditions of Contract",
  asAt: localIsoDate(),
  specialConditions: "",
  records: [],
};

export default function Home() {
  const [project, setProject] = useState<Project>(EMPTY);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ claim: ScoredClaim; text: string | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<Project>) => {
    setProject((p) => ({ ...p, ...patch }));
    setResult(null);
  };

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function draft(claim: ScoredClaim) {
    setNotice({ claim, text: null });
    const res = await fetch("/api/notice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, claim }) });
    const data = await res.json();
    setNotice({ claim, text: res.ok ? data.notice : `Error: ${data.error}` });
  }

  function downloadNotice() {
    if (!notice?.text) return;
    const html = `<html><body><pre style="font-family:Calibri,Arial;font-size:11pt;white-space:pre-wrap">${notice.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "application/msword" }));
    a.download = `Notice of claim - ${notice.claim.title.replace(/[^\w -]/g, "")}.doc`;
    a.click();
  }

  const shownRecord = project.records.find((r) => r.id === recordId);
  const counts = result?.claims.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {});

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">CR</div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Claim Radar</h1>
              <p className="text-xs text-slate-500">Find contractor claims in project records before they&apos;re time-barred</p>
            </div>
          </div>
          <a href="https://github.com/smiless0/claim-radar" className="text-sm text-slate-500 hover:text-slate-900">GitHub</a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">1. Project</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setProject(sample as Project);
                  setResult(null);
                  setError(null);
                }}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Load sample project
              </button>
              <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                Upload records
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".txt,.md,.eml,.json"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.length) update({ records: [...project.records, ...(await filesToRecords(e.target.files, project.records.map((r) => r.id)))] });
                  e.target.value = "";
                }}
              />
              {project.records.length > 0 && (
                <button onClick={() => update({ ...EMPTY })} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900">
                  Clear
                </button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="col-span-2">
                <span className="text-xs text-slate-500">Project name</span>
                <input value={project.name} onChange={(e) => update({ name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
              </label>
              <label>
                <span className="text-xs text-slate-500">Contract</span>
                <input value={project.contractForm} onChange={(e) => update({ contractForm: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
              </label>
              <label>
                <span className="text-xs text-slate-500">Review as at</span>
                <input type="date" value={project.asAt} onChange={(e) => update({ asAt: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="col-span-2">
                <span className="text-xs text-slate-500">Special conditions / amendments (time bars, notice clauses)</span>
                <textarea
                  value={project.specialConditions}
                  onChange={(e) => update({ specialConditions: e.target.value })}
                  rows={5}
                  placeholder="e.g. SC 4 - Clause 34.3 amended: EOT claims within 14 days..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">2. Records <span className="font-normal text-slate-500">({project.records.length})</span></h2>
            {project.records.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Load the sample project or upload emails, RFIs, TQs and site diaries (.txt, .eml, .md or .json).</p>
            ) : (
              <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                {project.records.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => setRecordId(r.id)} className="flex w-full items-start gap-3 py-2 text-left hover:bg-slate-50">
                      <span className="mt-0.5 w-20 shrink-0 font-mono text-xs text-slate-500">{r.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{r.subject}</span>
                        <span className="text-xs text-slate-500">{RECORD_LABEL[r.type]} &middot; {fmtDate(r.date)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-semibold">3. Claims</h2>
              <p className="text-sm text-slate-500">Checks every record against the contract&apos;s notice and time-bar provisions.</p>
            </div>
            <button
              onClick={scan}
              disabled={loading || project.records.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Scanning records..." : "Scan for claims"}
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

          {loading && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Reading {project.records.length} records and checking them against the contract...
            </div>
          )}

          {result && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold">{result.claims.length} potential claims</span>
                {counts?.urgent ? <span className="text-red-700">{counts.urgent} due within 7 days</span> : null}
                {counts?.prompt ? <span className="text-orange-700">{counts.prompt} need prompt notice</span> : null}
                {counts?.expired ? <span className="text-slate-600">{counts.expired} past deadline</span> : null}
                <span className="ml-auto text-xs text-slate-400">as at {fmtDate(result.asAt)}{result.cached ? " · cached demo result" : ""}</span>
              </div>
              {result.claims.map((c) => (
                <ClaimCard key={c.id} claim={c} records={project.records} onDraft={draft} onShowRecord={setRecordId} />
              ))}
              <p className="text-xs text-slate-400">
                Claim Radar flags possible claims for review. It is not legal advice: verify every deadline against the executed contract.
              </p>
            </>
          )}

          {!result && !loading && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Load a project and click <span className="font-medium text-slate-700">Scan for claims</span>.
            </div>
          )}
        </section>
      </main>

      {shownRecord && (
        <Modal title={`${shownRecord.id} - ${shownRecord.subject}`} onClose={() => setRecordId(null)}>
          <p className="mb-3 text-xs text-slate-500">
            {RECORD_LABEL[shownRecord.type]} &middot; {fmtDate(shownRecord.date)}
            {shownRecord.from ? ` · From: ${shownRecord.from}` : ""}
            {shownRecord.to ? ` · To: ${shownRecord.to}` : ""}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{shownRecord.body}</p>
        </Modal>
      )}

      {notice && (
        <Modal
          title={`Draft notice - ${notice.claim.title}`}
          onClose={() => setNotice(null)}
          footer={
            notice.text !== null && (
              <>
                <button onClick={() => navigator.clipboard.writeText(notice.text!)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                  Copy
                </button>
                <button onClick={downloadNotice} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                  Download .doc
                </button>
              </>
            )
          }
        >
          {notice.text !== null ? (
            <textarea
              value={notice.text}
              onChange={(e) => setNotice({ ...notice, text: e.target.value })}
              className="h-[60vh] w-full resize-none rounded-md border border-slate-200 p-3 font-mono text-xs leading-relaxed"
            />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Drafting notice of claim...</p>
          )}
        </Modal>
      )}
    </div>
  );
}
