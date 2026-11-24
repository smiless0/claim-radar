import { NextResponse } from "next/server";
import { draftNotice } from "@/lib/notice";
import type { Project, ScoredClaim } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { project, claim } = (await req.json()) as { project: Project; claim: ScoredClaim };
  try {
    return NextResponse.json({ notice: await draftNotice(project, claim) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Drafting failed" }, { status: 500 });
  }
}
