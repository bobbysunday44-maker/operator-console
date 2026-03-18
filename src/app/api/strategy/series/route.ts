import { NextResponse } from "next/server";
import { createSeries, getActiveSeries } from "@/lib/strategy/series-manager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || undefined;
  const series = await getActiveSeries(niche);
  return NextResponse.json({ series });
}

export async function POST(request: Request) {
  const body = await request.json();
  const series = await createSeries(body);
  return NextResponse.json({ series }, { status: 201 });
}
