// Runs Claim Radar over the sample project and scores it against the hidden claims in eval/expected.json.
// Usage: npm run eval            (live, needs ANTHROPIC_API_KEY)
//        npm run eval -- --save  (also writes src/data/sample-analysis.json for the no-key demo)
import { readFileSync, writeFileSync } from "node:fs";
import { analyzeProject } from "../src/lib/analyze";
import type { Project } from "../src/lib/types";

interface Expected {
  project: string;
  claims: { name: string; categories: string[]; records: string[] }[];
  decoys: string[];
}

async function main() {
  const expected: Expected = JSON.parse(readFileSync("eval/expected.json", "utf8"));
  const project: Project = JSON.parse(readFileSync(expected.project, "utf8"));
  const t0 = Date.now();
  const result = await analyzeProject(project);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const matched = new Set<string>();
  console.log(`\nClaim Radar eval - ${project.name} (${project.records.length} records, ${secs}s, ${result.model})\n`);
  let found = 0;
  for (const exp of expected.claims) {
    const hit = result.claims.find(
      (c) => !matched.has(c.id) && exp.categories.includes(c.category) && c.sourceRecordIds.some((r) => exp.records.includes(r))
    );
    if (hit) {
      matched.add(hit.id);
      found++;
    }
    console.log(`${hit ? "FOUND " : "MISSED"}  ${exp.name}${hit ? `  ->  ${hit.title} [${hit.clause}, deadline ${hit.deadline ?? "promptly"}]` : ""}`);
  }
  const extras = result.claims.filter((c) => !matched.has(c.id));
  const decoyHits = extras.filter((c) => c.sourceRecordIds.every((r) => expected.decoys.includes(r)));
  for (const c of extras) console.log(`EXTRA   ${c.title} (${c.sourceRecordIds.join(", ")})`);

  console.log(`\nRecall: ${found}/${expected.claims.length} hidden claims found`);
  console.log(`Decoys flagged: ${decoyHits.length}/${expected.decoys.length}`);
  console.log(`Other extra flags: ${extras.length - decoyHits.length}`);

  if (process.argv.includes("--save")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const raw = result.claims.map(({ deadline: _d, daysRemaining: _r, status: _s, ...c }) => c);
    writeFileSync("src/data/sample-analysis.json", JSON.stringify(raw, null, 2) + "\n");
    console.log("Saved src/data/sample-analysis.json");
  }
  process.exit(found === expected.claims.length && decoyHits.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
