/* ── Character Engine ──
 * Persistent character identity for consistent content.
 * Loads character prompt for pipeline injection.
 */

import { prisma } from "@/lib/db/prisma";

export async function getCharacterPrompt(characterId: string): Promise<string> {
  const char = await prisma.character.findUnique({
    where: { id: characterId },
    include: { profile: true },
  });

  if (!char) return "";

  let prompt = `CHARACTER IDENTITY: ${char.name}\n`;
  prompt += `Description: ${char.description}\n`;
  prompt += `Visual style: ${char.stylePrompt}\n`;

  if (char.profile) {
    const p = char.profile;
    if (p.personalityTraits.length > 0) prompt += `Personality: ${p.personalityTraits.join(", ")}\n`;
    if (p.speakingStyle) prompt += `Speaking style: ${p.speakingStyle}\n`;
    if (p.voiceProfile) prompt += `Voice: ${p.voiceProfile}\n`;
    if (p.catchphrases.length > 0) prompt += `Catchphrases: ${p.catchphrases.map((c) => `"${c}"`).join(", ")}\n`;
    if (p.doList.length > 0) prompt += `This character ALWAYS: ${p.doList.join("; ")}\n`;
    if (p.dontList.length > 0) prompt += `This character NEVER: ${p.dontList.join("; ")}\n`;
    if (p.visualStyle) prompt += `Visual direction: ${p.visualStyle}\n`;
    if (p.colorPalette.length > 0) prompt += `Color palette: ${p.colorPalette.join(", ")}\n`;
  }

  return prompt;
}

export async function getCharacterForContent(niche: string) {
  return prisma.character.findFirst({
    where: { niche, isActive: true },
    include: { profile: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProfile(characterId: string, data: {
  voiceProfile?: string;
  colorPalette?: string[];
  personalityTraits?: string[];
  catchphrases?: string[];
  doList?: string[];
  dontList?: string[];
  speakingStyle?: string;
  visualStyle?: string;
  voiceModelId?: string;
}) {
  return prisma.characterProfile.upsert({
    where: { characterId },
    update: data,
    create: { characterId, ...data },
  });
}

export async function updateConsistencyScore(characterId: string) {
  const profile = await prisma.characterProfile.findUnique({ where: { characterId } });
  if (!profile) return 0;

  // Score based on completeness of profile
  let score = 0;
  if (profile.personalityTraits.length > 0) score += 15;
  if (profile.speakingStyle) score += 15;
  if (profile.voiceProfile) score += 10;
  if (profile.catchphrases.length > 0) score += 10;
  if (profile.doList.length > 0) score += 10;
  if (profile.dontList.length > 0) score += 10;
  if (profile.visualStyle) score += 15;
  if (profile.colorPalette.length > 0) score += 10;
  if (profile.referenceVideoUrls.length > 0) score += 5;

  await prisma.characterProfile.update({
    where: { characterId },
    data: { consistencyScore: score, totalAppearances: { increment: 1 } },
  });

  return score;
}
