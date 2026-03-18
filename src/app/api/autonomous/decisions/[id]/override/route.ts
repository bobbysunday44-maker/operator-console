import { NextResponse } from "next/server";
import { overrideDecision } from "@/lib/autonomous/decision-engine";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { override, reason } = await request.json();
  const decision = await overrideDecision(id, override, reason);
  return NextResponse.json({ decision });
}
