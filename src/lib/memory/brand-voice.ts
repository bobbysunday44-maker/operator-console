/* ── Brand Voice ──
 * Per-niche voice identity: tone, vocabulary, style.
 * Injected into Writer prompts for consistent brand personality.
 */

import { prisma } from "@/lib/db/prisma";

const DEFAULT_VOICE = {
  toneDescription: "Confident but approachable. Uses humor when appropriate. Never preachy or salesy. Speaks like a knowledgeable friend, not a corporation.",
  vocabulary: ["game-changer", "lowkey", "insane", "no cap", "literally"],
  avoidWords: ["synergy", "leverage", "utilize", "pivot", "disrupt"],
  emojiStyle: "strategic",
  sentenceStyle: "short punchy",
};

export async function getBrandVoice(niche: string) {
  let voice = await prisma.brandVoice.findUnique({ where: { niche } });

  if (!voice) {
    voice = await prisma.brandVoice.create({
      data: {
        niche,
        toneDescription: DEFAULT_VOICE.toneDescription,
        vocabulary: DEFAULT_VOICE.vocabulary,
        avoidWords: DEFAULT_VOICE.avoidWords,
        emojiStyle: DEFAULT_VOICE.emojiStyle,
        sentenceStyle: DEFAULT_VOICE.sentenceStyle,
      },
    });
  }

  return voice;
}

export async function updateBrandVoice(niche: string, updates: {
  toneDescription?: string;
  vocabulary?: string[];
  avoidWords?: string[];
  emojiStyle?: string;
  sentenceStyle?: string;
  examplePosts?: string[];
  audiencePersona?: string;
}) {
  return prisma.brandVoice.upsert({
    where: { niche },
    update: updates,
    create: { niche, toneDescription: updates.toneDescription || DEFAULT_VOICE.toneDescription, ...updates },
  });
}

export async function getVoiceForPrompt(niche: string): Promise<string> {
  const voice = await getBrandVoice(niche);

  let prompt = "BRAND VOICE:\n";
  prompt += `Tone: ${voice.toneDescription}\n`;

  if (voice.vocabulary.length > 0) {
    prompt += `USE these words/phrases: ${voice.vocabulary.join(", ")}\n`;
  }
  if (voice.avoidWords.length > 0) {
    prompt += `NEVER use: ${voice.avoidWords.join(", ")}\n`;
  }
  if (voice.emojiStyle) {
    prompt += `Emoji usage: ${voice.emojiStyle}\n`;
  }
  if (voice.sentenceStyle) {
    prompt += `Writing style: ${voice.sentenceStyle}\n`;
  }
  if (voice.audiencePersona) {
    prompt += `Audience: ${voice.audiencePersona}\n`;
  }

  return prompt;
}
