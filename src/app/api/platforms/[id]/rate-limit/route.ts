import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { initializeRateLimits } from "@/lib/social/rate-limiter";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let limit = await prisma.platformRateLimit.findUnique({ where: { platformId: id } });
  if (!limit) {
    const platform = await prisma.platform.findUnique({ where: { id } });
    if (!platform) return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    limit = await initializeRateLimits(id, platform.name);
  }
  return NextResponse.json({ rateLimit: limit });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const limit = await prisma.platformRateLimit.update({ where: { platformId: id }, data: body });
  return NextResponse.json({ rateLimit: limit });
}
