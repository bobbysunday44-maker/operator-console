/* GET /api/characters — List characters
 * POST /api/characters — Create a character
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const characters = await prisma.character.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ characters });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, stylePrompt, niche, referenceImages } = body as {
    name?: string;
    description?: string;
    stylePrompt?: string;
    niche?: string;
    referenceImages?: string[];
  };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const character = await prisma.character.create({
    data: {
      name,
      description: description || "",
      stylePrompt: stylePrompt || "",
      niche: niche || null,
      referenceImages: referenceImages || [],
      isActive: true,
    },
  });

  return NextResponse.json({ character }, { status: 201 });
}
