import { NextResponse } from "next/server";
import { getROIReport } from "@/lib/monetization/affiliate-manager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || undefined;
  const days = parseInt(searchParams.get("days") || "30");
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const report = await getROIReport(niche, startDate);
  return NextResponse.json({ report });
}
