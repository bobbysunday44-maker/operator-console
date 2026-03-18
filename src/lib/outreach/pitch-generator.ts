/* ── Pitch Generator ──
 * Uses Claude Sonnet with web search to research a business and generate
 * a hyper-personalized cold email pitch for AI influencer advertising.
 *
 * Unlike the basic `generatePitch` in outreach-engine.ts (which uses a
 * simple prompt without web search), this module actively researches the
 * prospect's website, products, and market position to craft a pitch
 * that references specific details about their business.
 *
 * Usage:
 *   import { generatePersonalizedPitch } from "@/lib/outreach/pitch-generator";
 *   const pitch = await generatePersonalizedPitch("Acme Corp", "https://acme.com", "Nova", "tech gadgets");
 */

import Anthropic from "@anthropic-ai/sdk";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";

export interface PersonalizedPitch {
  subject: string;
  body: string;
  angle: string;
}

const PITCH_SYSTEM_PROMPT = `You are an elite B2B sales copywriter for OpenClaw, an AI advertising agency. Your job is to write cold emails that get replies.

OpenClaw creates AI-generated content creators (characters with real social media followings) that advertise products for businesses. The model is commission-based: the business pays nothing upfront, and OpenClaw earns a percentage of sales driven by the content.

Your cold emails must:
1. Reference SPECIFIC details about the prospect's business — their actual products, brand positioning, target audience, and recent activity. Generic emails get deleted.
2. Lead with value, not features. Show the prospect you understand their growth challenges before pitching the solution.
3. Keep it under 200 words. Busy founders skim. Every sentence must earn its place.
4. Include a clear, low-friction CTA (15-minute call, not a 1-hour meeting).
5. Sound human, not AI-generated. No buzzwords, no "leverage synergies," no "unlock potential."
6. Explain the commission-only model early — it's the strongest differentiator.

You will be given a business name, their website URL, an AI character name, and a niche. Use web search to research the business BEFORE writing the pitch.`;

function buildResearchPrompt(
  businessName: string,
  businessUrl: string | null,
  characterName: string,
  niche: string,
): string {
  return `Research this business and write a hyper-personalized cold email pitch.

BUSINESS: ${businessName}
${businessUrl ? `WEBSITE: ${businessUrl}` : ""}
AI CHARACTER: ${characterName} (AI content creator in the ${niche} space)
NICHE: ${niche}

STEP 1: Research the business.
${businessUrl ? `- Visit ${businessUrl} and understand what they sell, who their customers are, and how they position themselves.` : `- Search the web for "${businessName}" to find their website, products, and market position.`}
- Look at their social media presence — are they active on TikTok, Instagram, YouTube? Are they doing influencer marketing already?
- Identify 2-3 specific products or services they offer that would work well in short-form video content.
- Note any recent news, launches, or campaigns they're running.

STEP 2: Write the cold email.
Using your research, write an email that:
- Opens with a specific observation about THEIR business (not about us)
- Explains how ${characterName} (our AI creator in ${niche}) would create content featuring their specific products
- States the commission-only model — zero upfront cost, they pay only on sales driven
- Mentions the platforms (TikTok, Instagram, YouTube) and content types (product showcases, tutorials, reviews)
- Ends with a low-friction CTA

STEP 3: Identify the pitch angle.
In one sentence, describe the core angle of this pitch — what's the single most compelling reason THIS specific business should work with us?

Respond in this exact JSON format (no markdown, no code blocks):
{
  "subject": "email subject line — short, specific, no clickbait",
  "body": "the full email body — under 200 words, personalized to the business",
  "angle": "one-sentence pitch angle summary"
}`;
}

/**
 * Research a business via web search and generate a hyper-personalized cold email.
 * Uses Claude Sonnet with web_search tool for live business intelligence.
 */
export async function generatePersonalizedPitch(
  businessName: string,
  businessUrl: string | null,
  characterName: string,
  niche: string,
): Promise<PersonalizedPitch> {
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: PITCH_SYSTEM_PROMPT,
      tools: [
        { type: "web_search_20260209" as const, name: "web_search" as const },
      ],
      messages: [
        {
          role: "user",
          content: buildResearchPrompt(businessName, businessUrl, characterName, niche),
        },
      ],
    });

    const latency = Date.now() - startTime;
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

    await logModelUsage({
      model: "claude",
      taskType: "pitch_generation",
      tokensIn,
      tokensOut,
      cost,
      latency,
      success: true,
    });

    // Extract text from response (may have web search tool_use blocks mixed in)
    const textBlocks = response.content.filter((b) => b.type === "text");
    const fullText = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");

    // Parse JSON from response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || `${characterName} x ${businessName} — content partnership`,
        body: parsed.body || "",
        angle: parsed.angle || "Commission-based AI influencer content",
      };
    }

    throw new Error("Could not parse pitch JSON from Claude response");
  } catch (err) {
    const latency = Date.now() - startTime;

    await logModelUsage({
      model: "claude",
      taskType: "pitch_generation",
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
      latency,
      success: false,
    });

    console.error("[PitchGenerator] Failed:", err);

    // Return a reasonable fallback so the outreach pipeline doesn't break
    return {
      subject: `${characterName} x ${businessName} — commission-only content partnership`,
      body: `Hi ${businessName} team,

I came across your brand and think there's a strong fit for a content partnership.

${characterName} is an AI content creator in the ${niche} space with an engaged following across TikTok, Instagram, and YouTube. We create short-form video content — product showcases, tutorials, lifestyle integrations — that drives real purchases.

The model is simple: we produce the content, you pay commission only on sales we drive. Zero upfront cost, zero risk.

Would you be open to a quick 15-minute call this week?

Best,
OpenClaw Outreach`,
      angle: "Commission-based AI influencer advertising with zero upfront cost",
    };
  }
}

/**
 * Generate pitches for multiple businesses in batch.
 * Runs sequentially to respect API rate limits.
 */
export async function generateBatchPitches(
  businesses: Array<{
    businessName: string;
    businessUrl: string | null;
    characterName: string;
    niche: string;
  }>,
): Promise<Array<PersonalizedPitch & { businessName: string }>> {
  const results: Array<PersonalizedPitch & { businessName: string }> = [];

  for (const biz of businesses) {
    const pitch = await generatePersonalizedPitch(
      biz.businessName,
      biz.businessUrl,
      biz.characterName,
      biz.niche,
    );
    results.push({ ...pitch, businessName: biz.businessName });
  }

  return results;
}
