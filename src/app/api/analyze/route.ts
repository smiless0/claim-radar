import { NextResponse } from "next/server";
import { analyzeProject, toResult } from "@/lib/analyze";
import type { DetectedClaim, Project } from "@/lib/types";
import sample from "@/data/sample-project.json";
import sampleAnalysis from "@/data/sample-analysis.json";

export const maxDuration = 120;

const isUnchangedSample = (p: Project) => JSON.stringify(p) === JSON.stringify(sample);

export async function POST(req: Request) {
  const project = (await req.json()) as Project;
  if (!project?.records?.length) {
    return NextResponse.json({ error: "Add at least one project record." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    if (isUnchangedSample(project) && (sampleAnalysis as DetectedClaim[]).length) {
      return NextResponse.json(toResult(sampleAnalysis as DetectedClaim[], project.asAt, true));
    }
    return NextResponse.json(
      { error: "Live analysis needs ANTHROPIC_API_KEY on the server. The unmodified sample project works without it." },
      { status: 503 }
    );
  }
  try {
    return NextResponse.json(await analyzeProject(project));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed" }, { status: 500 });
  }
}
