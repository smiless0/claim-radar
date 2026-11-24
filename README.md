# Claim Radar

Contractors often miss valid claims (variations, extensions of time, latent conditions, delay costs) buried in the large volume of project records: emails, RFIs, TQs, site diaries. Sometimes they only spot them after the notice period has passed and a time bar applies.

**Claim Radar** reads project records, flags possible claims, checks each one against the contract's notice provisions (AS 4000-1997 plus any special conditions), shows a countdown to each notice deadline, and drafts the notice of claim.

> Built with [Devin](https://devin.ai) as a small proof of concept. Not legal advice.

## Features

- **Claim detection:** finds possible contractor entitlements across emails, RFIs, TQs, site diaries, minutes and letters. Ignores matters that are the contractor's own risk (subcontractor labour shortages, defects, weather within the allowance).
- **Contract check:** applies the AS 4000 notice clauses (cl 25, 33, 34, 36, 41) *and* the project's special conditions (e.g. an EOT time bar cut from 28 to 14 days).
- **Time-bar dashboard:** each claim shows its trigger date, deadline and days remaining: urgent, soon, ok, "notify promptly", or past deadline.
- **Evidence:** every flag cites the source records with verbatim quotes.
- **Notice drafting:** generates an editable notice of claim that you can copy or download as a Word document.
- **Sample project:** a realistic AS 4000 project (*Harbourside Medical Centre - Stage 2*) with 18 records, 5 hidden claims and 5 decoys.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without an API key, the unmodified sample project still works using a cached analysis, and notices are drafted from a template.

When deploying publicly, set `APP_PASSWORD` so that only people with the password can use the app (and spend API credit). The browser asks for it on first visit; any username works.

## Evaluation

`eval/expected.json` lists the claims hidden in the sample project, plus decoy records that should *not* be flagged.

```bash
npm run eval            # runs live analysis and prints recall + false positives
npm run eval -- --save  # also refreshes the cached demo result
```

## How it works

| Piece | File |
|---|---|
| AS 4000 notice provisions (defaults) | `src/lib/as4000.ts` |
| Claim detection (Claude, structured tool output, validated with zod) | `src/lib/analyze.ts` |
| Deadline maths (deterministic, not left to the LLM) | `src/lib/deadlines.ts` |
| Notice drafting | `src/lib/notice.ts` |
| API routes | `src/app/api/analyze`, `src/app/api/notice` |
| UI | `src/app/page.tsx`, `src/components/` |

Stack: Next.js 15, TypeScript, Tailwind CSS, Anthropic Claude API.

## Built with Devin

This project was built by [Devin](https://devin.ai) (Cognition's AI software engineer), steered by me through chat. Each change lands as a pull request with a link to the Devin session that wrote it.

| Step | My instruction to Devin | What Devin did |
|---|---|---|
| 1 | Shared my LinkedIn post describing the idea | Proposed the MVP scope and architecture |
| 2 | "Build something small using Devin and be able to prove it" | Scoped a 1-2 day slice: detection, time bars, notice drafting, eval |
| 3 | "Call the repo claim radar" | Scaffolded the app, wrote the sample project with hidden claims and the eval harness, opened the first PR |

*(This table is updated as the project progresses.)*
