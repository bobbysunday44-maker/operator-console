import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createProfile } from "@/lib/characters/character-engine";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.characterProfile.findUnique({ where: { characterId: id } });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const profile = await createProfile(id, body);
  return NextResponse.json({ profile });
}
