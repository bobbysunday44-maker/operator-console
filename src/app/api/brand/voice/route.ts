import { NextResponse } from "next/server";
import { getBrandVoice, updateBrandVoice } from "@/lib/memory/brand-voice";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || "AI";
  const voice = await getBrandVoice(niche);
  return NextResponse.json({ voice });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { niche, ...updates } = body;
  const voice = await updateBrandVoice(niche || "AI", updates);
  return NextResponse.json({ voice });
}
