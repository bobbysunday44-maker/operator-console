/* ── Outreach Automation ──
 * Makes the Outreach Bot autonomous:
 * - Find prospects using Claude with web search
 * - Run full outreach cycles (find → pitch → queue → follow-up)
 * - Process follow-ups automatically
 *
 * Usage:
 *   import { findProspects, runOutreachCycle, processFollowUps } from "@/lib/business/outreach-automation";
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { queueOutreach, scheduleFollowUp } from "@/lib/outreach/outreach-engine";
import { generatePersonalizedPitch } from "@/lib/outreach/pitch-generator";
import { followUp1, followUp2, followUp3 } from "@/lib/outreach/email-templates";
import { addMemory } from "@/lib/agent-runtime/memory-stream";

// ── Types ──

export interface Prospect {
  businessName: string;
  businessUrl: string | null;
  contactEmail: string | null;
  reason: string;
}

export interface OutreachCycleResult {
  niche: string;
  prospectsFound: number;
  pitchesGenerated: number;
  outreachesQueued: number;
  followUpsScheduled: number;
  errors: string[];
}

// ── Prospect Discovery ──

/**
 * Use Claude Sonnet with web search to find businesses that would benefit
 * from AI influencer marketing in a given niche.
 */
export async function findProspects(
  niche: string,
  count: number = 5
): Promise<Prospect[]> {
  try {
    const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
    const client = new Anthropic({ apiKey });
    const startTime = Date.now();

    const prompt = `You are a business development researcher for OpenClaw, an AI advertising agency. Your job is to find e-commerce businesses and brands that would benefit from AI influencer marketing.

Search for:
- "${niche} e-commerce stores" and "${niche} brands on Instagram/TikTok"
- DTC (direct-to-consumer) brands in the ${niche} space
- Brands that are already doing influencer marketing (they understand the model)
- Brands with an online store where we can track affiliate sales

Find ${count} real businesses. For each, provide:
1. businessName: The actual company name
2. businessUrl: Their website URL (if you can find it)
3. contactEmail: A contact email if publicly available (check their website's contact page)
4. reason: A 1-2 sentence explanation of why they're a good fit for AI influencer advertising

IMPORTANT:
- These must be REAL businesses you can verify exist via web search
- Prefer small-to-medium brands (not Fortune 500) — they're more likely to try new marketing channels
- Avoid businesses that are obviously AI/tech companies (they know we're AI)
- Focus on brands with products that photograph/video well

Respond with ONLY a JSON array, no markdown, no code blocks:
[
  {
    "businessName": "...",
    "businessUrl": "...",
    "contactEmail": "..." or null,
    "reason": "..."
  }
]`;

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        tools: [
          { type: "web_search_20260209" as const, name: "web_search" as const },
        ],
        messages: [{ role: "user", content: prompt }],
      });

      const latency = Date.now() - startTime;
      const tokensIn = response.usage.input_tokens;
      const tokensOut = response.usage.output_tokens;
      const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

      await logModelUsage({
        model: "claude",
        taskType: "prospect_discovery",
        tokensIn,
        tokensOut,
        cost,
        latency,
        success: true,
      });

      // Extract text from response (may have web search tool_use blocks)
      const textBlocks = response.content.filter((b) => b.type === "text");
      const fullText = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");

      // Parse JSON array from response
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Prospect[];
        // Validate and clean
        return parsed
          .filter((p) => p.businessName && typeof p.businessName === "string")
          .slice(0, count)
          .map((p) => ({
            businessName: p.businessName.trim(),
            businessUrl: p.businessUrl?.trim() || null,
            contactEmail: p.contactEmail?.trim() || null,
            reason: p.reason?.trim() || `Potential fit for ${niche} AI influencer marketing`,
          }));
      }

      console.error("[OutreachAutomation] Could not parse prospects JSON from response");
      return [];
    } catch (apiErr) {
      const latency = Date.now() - startTime;
      await logModelUsage({
        model: "claude",
        taskType: "prospect_discovery",
        tokensIn: 0,
        tokensOut: 0,
        cost: 0,
        latency,
        success: false,
        error: apiErr instanceof Error ? apiErr.message : "Unknown error",
      });
      throw apiErr;
    }
  } catch (err) {
    console.error("[OutreachAutomation] findProspects failed:", err);
    throw err;
  }
}

// ── Full Outreach Cycle ──

/**
 * Full autonomous outreach cycle:
 * 1. Find prospects in the niche
 * 2. Generate personalized pitches
 * 3. Queue outreach emails
 * 4. Schedule follow-ups
 * 5. Store memory for Outreach Bot
 */
export async function runOutreachCycle(
  niche: string,
  count: number = 5
): Promise<OutreachCycleResult> {
  const result: OutreachCycleResult = {
    niche,
    prospectsFound: 0,
    pitchesGenerated: 0,
    outreachesQueued: 0,
    followUpsScheduled: 0,
    errors: [],
  };

  try {
    // 1. Find prospects
    let prospects: Prospect[];
    try {
      prospects = await findProspects(niche, count);
      result.prospectsFound = prospects.length;
    } catch (err) {
      const msg = `Prospect discovery failed: ${err instanceof Error ? err.message : "Unknown"}`;
      result.errors.push(msg);
      console.error("[OutreachAutomation]", msg);
      return result;
    }

    if (prospects.length === 0) {
      result.errors.push("No prospects found for this niche");
      return result;
    }

    // Get a character name to use in pitches
    const character = await prisma.character.findFirst({
      where: { isActive: true, niche },
    });
    const characterName = character?.name || "our AI creator";

    // 2. Process each prospect
    for (const prospect of prospects) {
      try {
        // Check if we've already reached out to this business
        const existing = await prisma.outreach.findFirst({
          where: {
            businessName: {
              equals: prospect.businessName,
              mode: "insensitive",
            },
          },
        });

        if (existing) {
          result.errors.push(`Already contacted: ${prospect.businessName}`);
          continue;
        }

        // Generate personalized pitch
        let subject: string;
        let body: string;
        try {
          const pitch = await generatePersonalizedPitch(
            prospect.businessName,
            prospect.businessUrl,
            characterName,
            niche
          );
          subject = pitch.subject;
          body = pitch.body;
          result.pitchesGenerated++;
        } catch (pitchErr) {
          // Use a simple template fallback
          subject = `${characterName} x ${prospect.businessName} — content partnership`;
          body = `Hi ${prospect.businessName} team,\n\nWe'd love to create AI-generated content promoting your products. Commission-based — you only pay on sales we drive.\n\nBest,\nOpenClaw`;
          result.errors.push(`Pitch generation failed for ${prospect.businessName}: ${pitchErr instanceof Error ? pitchErr.message : "Unknown"}`);
        }

        // Skip if no contact email — we still record the prospect
        if (!prospect.contactEmail) {
          // Still create the outreach record with placeholder
          result.errors.push(`No email found for ${prospect.businessName} — queued without sending`);
        }

        // Queue outreach
        try {
          const outreach = await queueOutreach({
            businessName: prospect.businessName,
            businessEmail: prospect.contactEmail || `contact@${prospect.businessName.toLowerCase().replace(/\s/g, "")}.com`,
            businessUrl: prospect.businessUrl || undefined,
            characterName,
            niche,
          });

          // Update with our generated pitch
          await prisma.outreach.update({
            where: { id: outreach.id },
            data: { subject, messageBody: body },
          });

          result.outreachesQueued++;

          // Schedule follow-up in 3 days
          try {
            await scheduleFollowUp(outreach.id, 3);
            result.followUpsScheduled++;
          } catch (fuErr) {
            result.errors.push(`Follow-up scheduling failed for ${prospect.businessName}: ${fuErr instanceof Error ? fuErr.message : "Unknown"}`);
          }
        } catch (queueErr) {
          result.errors.push(`Queue failed for ${prospect.businessName}: ${queueErr instanceof Error ? queueErr.message : "Unknown"}`);
        }
      } catch (prospectErr) {
        result.errors.push(`Processing failed for ${prospect.businessName}: ${prospectErr instanceof Error ? prospectErr.message : "Unknown"}`);
      }
    }

    // 3. Store memory for Outreach Bot
    try {
      await addMemory(
        "agent-outreach",
        `Pitched ${result.outreachesQueued} businesses today in ${niche}. Found ${result.prospectsFound} prospects. ${result.pitchesGenerated} personalized pitches generated. ${result.followUpsScheduled} follow-ups scheduled.${result.errors.length > 0 ? ` Encountered ${result.errors.length} issues.` : ""}`,
        "experience",
        6,
        "outreach-automation",
        undefined,
        ["outreach-cycle", niche, `prospects-${result.prospectsFound}`]
      );
    } catch (memErr) {
      console.error("[OutreachAutomation] Failed to store cycle memory:", memErr);
    }

    // 4. Log activity
    await prisma.activityLog.create({
      data: {
        type: "success",
        message: `Outreach cycle completed: ${niche}. ${result.prospectsFound} found, ${result.outreachesQueued} queued, ${result.followUpsScheduled} follow-ups scheduled.`,
        source: "system",
        metadata: result as unknown as object,
      },
    });

    return result;
  } catch (err) {
    console.error("[OutreachAutomation] runOutreachCycle failed:", err);
    result.errors.push(`Cycle failed: ${err instanceof Error ? err.message : "Unknown"}`);
    return result;
  }
}

// ── Follow-Up Processing ──

/**
 * Background worker: process due follow-ups.
 * Finds outreaches where nextFollowUp <= now and followUpCount < 3.
 * Generates follow-up email from template and updates the record.
 */
export async function processFollowUps(): Promise<{
  processed: number;
  errors: string[];
}> {
  const results = { processed: 0, errors: [] as string[] };

  try {
    const now = new Date();

    // Find outreaches due for follow-up
    const dueOutreaches = await prisma.outreach.findMany({
      where: {
        nextFollowUp: { lte: now },
        followUpCount: { lt: 3 },
        status: { in: ["sent", "opened"] }, // don't follow up on replied/accepted/rejected
      },
      include: { campaign: true },
      take: 20, // Process max 20 per batch
    });

    if (dueOutreaches.length === 0) {
      return results;
    }

    console.log(`[OutreachAutomation] Processing ${dueOutreaches.length} follow-ups...`);

    for (const outreach of dueOutreaches) {
      try {
        const characterName = "our AI creator"; // Could look up from campaign
        let followUpEmail: { subject: string; body: string };

        // Select template based on follow-up count
        switch (outreach.followUpCount) {
          case 0:
            // First follow-up (Day 3 — gentle nudge)
            followUpEmail = followUp1(outreach.businessName, characterName);
            break;
          case 1:
            // Second follow-up (Day 7 — value-add)
            followUpEmail = followUp2(outreach.businessName, characterName);
            break;
          case 2:
            // Third follow-up (Day 14 — break-up)
            followUpEmail = followUp3(outreach.businessName);
            break;
          default:
            // Should not happen due to followUpCount < 3 filter, but just in case
            continue;
        }

        // Calculate next follow-up date
        const nextFollowUpDays = outreach.followUpCount === 0 ? 4 : outreach.followUpCount === 1 ? 7 : null;
        const nextFollowUp = nextFollowUpDays
          ? new Date(now.getTime() + nextFollowUpDays * 24 * 60 * 60 * 1000)
          : null;

        // Update outreach record
        await prisma.outreach.update({
          where: { id: outreach.id },
          data: {
            followUpCount: { increment: 1 },
            nextFollowUp,
            messageBody: followUpEmail.body,
            subject: followUpEmail.subject,
            // Keep status as-is (sent or opened)
          },
        });

        results.processed++;
      } catch (err) {
        const msg = `Follow-up failed for ${outreach.businessName}: ${err instanceof Error ? err.message : "Unknown"}`;
        results.errors.push(msg);
        console.error("[OutreachAutomation]", msg);
      }
    }

    // Log results
    if (results.processed > 0) {
      await prisma.activityLog.create({
        data: {
          type: "info",
          message: `Processed ${results.processed} outreach follow-ups${results.errors.length > 0 ? ` (${results.errors.length} errors)` : ""}`,
          source: "system",
          metadata: results as unknown as object,
        },
      });

      console.log(`[OutreachAutomation] Processed ${results.processed} follow-ups, ${results.errors.length} errors`);
    }

    return results;
  } catch (err) {
    console.error("[OutreachAutomation] processFollowUps failed:", err);
    results.errors.push(`Processing failed: ${err instanceof Error ? err.message : "Unknown"}`);
    return results;
  }
}
