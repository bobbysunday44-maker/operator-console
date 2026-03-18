/* ── OpenClaw Multi-Language Engine ──
 * Translates content into 10 supported languages using Claude Sonnet.
 * Maps languages to Qwen3-TTS voice speakers for voiceover generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";

// ── Supported Languages ──

export interface SupportedLanguage {
  code: string;
  name: string;
  voiceLang: string;
  speakers: string[];
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", voiceLang: "english", speakers: ["serena", "aiden", "ryan", "vivian"] },
  { code: "zh", name: "Chinese", voiceLang: "chinese", speakers: ["sohee", "uncle_fu"] },
  { code: "ja", name: "Japanese", voiceLang: "japanese", speakers: ["ono_anna"] },
  { code: "ko", name: "Korean", voiceLang: "korean", speakers: ["sohee"] },
  { code: "fr", name: "French", voiceLang: "french", speakers: ["serena"] },
  { code: "de", name: "German", voiceLang: "german", speakers: ["eric"] },
  { code: "it", name: "Italian", voiceLang: "italian", speakers: ["vivian"] },
  { code: "pt", name: "Portuguese", voiceLang: "portuguese", speakers: ["dylan"] },
  { code: "ru", name: "Russian", voiceLang: "russian", speakers: ["aiden"] },
  { code: "es", name: "Spanish", voiceLang: "spanish", speakers: ["serena"] },
];

// ── Public API ──

/**
 * Returns all supported languages.
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Returns the best voice speaker for a given language code.
 * Falls back to the first speaker in the list for that language,
 * or "serena" if the language is unknown.
 */
export function getVoiceSpeaker(langCode: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  if (!lang || lang.speakers.length === 0) return "serena";
  return lang.speakers[0];
}

/**
 * Translate a content item's script and title into the specified target languages.
 * Creates new ContentItem records for each translation, tagged with:
 *   - `translated:${langCode}` (identifies this as a translation)
 *   - `source:${originalId}` (links back to the original content)
 *
 * Returns the array of newly created ContentItem records.
 */
export async function translateContent(
  contentItemId: string,
  targetLanguages: string[],
): Promise<{ id: string; title: string; lang: string }[]> {
  // Validate target languages
  const validCodes = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));
  const langs = targetLanguages.filter((code) => validCodes.has(code));
  if (langs.length === 0) {
    throw new Error("No valid target languages provided");
  }

  // Fetch original content
  const original = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      title: true,
      description: true,
      script: true,
      niche: true,
      tags: true,
      targetPlatforms: true,
      qualityTier: true,
    },
  });

  if (!original) {
    throw new Error(`Content item ${contentItemId} not found`);
  }

  if (!original.script && !original.description) {
    throw new Error("Content has no script or description to translate");
  }

  // Build the text to translate
  const textToTranslate = [
    original.title ? `TITLE: ${original.title}` : null,
    original.description ? `CAPTION: ${original.description}` : null,
    original.script ? `SCRIPT: ${original.script}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Build language name list for the prompt
  const langNames = langs.map((code) => {
    const l = SUPPORTED_LANGUAGES.find((s) => s.code === code);
    return l ? `${l.name} (${code})` : code;
  });

  // Call Claude Sonnet for translation
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a professional translator for social media content.
Translate the given content into the requested languages.
Preserve the tone, style, and emotional impact of the original.
For social media captions, keep hashtags relevant to each language's audience.
For video scripts, ensure the translated text sounds natural when spoken aloud.

Return your translations as a JSON object with this exact structure:
{
  "translations": {
    "<lang_code>": {
      "title": "translated title",
      "caption": "translated caption/description",
      "script": "translated script"
    }
  }
}

Only include fields that were provided in the original. Use the exact language codes provided.`;

  const userPrompt = `Translate the following content into these languages: ${langNames.join(", ")}

${textToTranslate}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text from response
  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parse JSON from response (handle markdown code blocks)
  let translationsData: Record<string, { title?: string; caption?: string; script?: string }>;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    translationsData = parsed.translations || parsed;
  } catch (e) {
    throw new Error(`Failed to parse translation response: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Create ContentItem records for each translation
  const created: { id: string; title: string; lang: string }[] = [];

  for (const langCode of langs) {
    const translation = translationsData[langCode];
    if (!translation) continue;

    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const translatedTitle = translation.title || `${original.title} [${langInfo?.name || langCode}]`;

    const item = await prisma.contentItem.create({
      data: {
        title: translatedTitle,
        description: translation.caption || original.description,
        script: translation.script || original.script,
        niche: original.niche,
        tags: [
          ...original.tags.filter((t) => !t.startsWith("translated:") && !t.startsWith("source:")),
          `translated:${langCode}`,
          `source:${original.id}`,
          `lang:${langCode}`,
        ],
        targetPlatforms: original.targetPlatforms,
        status: "idea",
        qualityTier: original.qualityTier,
        totalCost: 0,
      },
    });

    created.push({ id: item.id, title: item.title, lang: langCode });
  }

  // Log the translation activity
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Translated "${original.title}" into ${created.map((c) => c.lang).join(", ")}`,
      source: "i18n",
      metadata: { originalId: contentItemId, translations: created },
    },
  });

  return created;
}

/**
 * Find all translations of a content item by checking tags for `source:${id}`.
 */
export async function getTranslations(contentItemId: string) {
  const translations = await prisma.contentItem.findMany({
    where: {
      tags: { has: `source:${contentItemId}` },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      tags: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract language code from tags
  return translations.map((t) => {
    const langTag = t.tags.find((tag) => tag.startsWith("translated:"));
    const langCode = langTag ? langTag.replace("translated:", "") : "unknown";
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);

    return {
      ...t,
      langCode,
      langName: langInfo?.name || langCode,
      voiceSpeaker: getVoiceSpeaker(langCode),
    };
  });
}
