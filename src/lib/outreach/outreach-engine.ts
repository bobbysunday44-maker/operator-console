/* ── Outreach Engine ──
 * Queue outreach emails, generate personalized pitches via Claude Sonnet,
 * schedule follow-ups, and track open/reply/accept rates.
 */

import { prisma } from "@/lib/db/prisma";

interface QueueOutreachInput {
  campaignId?: string;
  businessName: string;
  businessEmail: string;
  businessUrl?: string;
  contactName?: string;
  channel?: string; // email, dm, linkedin
  characterName?: string;
  niche?: string;
}

/** Queue a new outreach — creates record and generates personalized pitch */
export async function queueOutreach(data: QueueOutreachInput) {
  // Generate personalized pitch if we have enough info
  let subject: string | null = null;
  let messageBody: string | null = null;

  if (data.niche && data.characterName) {
    const pitch = await generatePitch(
      data.businessName,
      data.businessUrl || null,
      data.characterName,
      data.niche
    );
    subject = pitch.subject;
    messageBody = pitch.body;
  }

  const outreach = await prisma.outreach.create({
    data: {
      campaignId: data.campaignId || null,
      businessName: data.businessName,
      businessEmail: data.businessEmail,
      businessUrl: data.businessUrl || null,
      contactName: data.contactName || null,
      channel: data.channel || "email",
      subject,
      messageBody,
      status: "queued",
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "info",
      message: `Outreach queued: ${data.businessName} (${data.businessEmail})`,
      source: "system",
      metadata: { outreachId: outreach.id },
    },
  });

  return outreach;
}

/** Generate a personalized cold email pitch using Claude Sonnet */
export async function generatePitch(
  businessName: string,
  businessUrl: string | null,
  characterName: string,
  niche: string
): Promise<{ subject: string; body: string }> {
  // Get API key from settings
  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_API_KEY" },
  });

  if (!apiKeySetting?.value) {
    // Return a template pitch if no API key configured
    return {
      subject: `Partnership opportunity: ${characterName} x ${businessName}`,
      body: `Hi,\n\nI represent ${characterName}, an AI content creator in the ${niche} space. We'd love to explore a partnership with ${businessName}.\n\nOur content reaches engaged audiences interested in ${niche}, and we believe your products/services would resonate well with our community.\n\nWould you be open to a brief conversation about collaboration?\n\nBest regards,\n${characterName} Team`,
    };
  }

  const prompt = `You are a business development specialist for an AI content agency. Write a personalized cold outreach email to pitch a partnership.

Business: ${businessName}
${businessUrl ? `Website: ${businessUrl}` : ""}
AI Character: ${characterName} (AI content creator)
Niche: ${niche}

Write a short, compelling cold email that:
1. Shows you've researched the business
2. Explains the value proposition (AI-generated content promoting their brand to engaged audiences)
3. Mentions commission-based model (they only pay for results)
4. Includes a clear CTA (schedule a call or reply to discuss)
5. Keeps it under 150 words

Respond in JSON format: { "subject": "...", "body": "..." }`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeySetting.value,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { subject: parsed.subject, body: parsed.body };
    }

    throw new Error("Could not parse pitch response");
  } catch (err) {
    // Fallback template if API fails
    console.error("Pitch generation failed:", err);
    return {
      subject: `Partnership opportunity: ${characterName} x ${businessName}`,
      body: `Hi,\n\nI represent ${characterName}, an AI content creator in the ${niche} space. We'd love to explore a partnership with ${businessName}.\n\nOur content reaches engaged audiences interested in ${niche}, and we believe your products/services would resonate well with our community.\n\nWould you be open to a brief conversation about collaboration?\n\nBest regards,\n${characterName} Team`,
    };
  }
}

/** Process queued outreaches — marks them as sent (actual sending handled by external email service) */
export async function processOutreachQueue() {
  const queued = await prisma.outreach.findMany({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const results = { processed: 0, errors: [] as string[] };

  for (const outreach of queued) {
    try {
      if (!outreach.messageBody) {
        results.errors.push(`Outreach ${outreach.id} has no message body`);
        continue;
      }

      // Mark as sent — actual email sending would be integrated here
      // (e.g., SendGrid, AWS SES, SMTP, or Gmail API)
      await prisma.outreach.update({
        where: { id: outreach.id },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });

      results.processed++;
    } catch (err) {
      results.errors.push(
        `Failed to process outreach ${outreach.id}: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  if (results.processed > 0) {
    await prisma.activityLog.create({
      data: {
        type: "success",
        message: `Outreach queue processed: ${results.processed} sent`,
        source: "system",
      },
    });
  }

  return results;
}

/** Schedule a follow-up for an outreach */
export async function scheduleFollowUp(outreachId: string, days: number) {
  const outreach = await prisma.outreach.findUnique({ where: { id: outreachId } });
  if (!outreach) throw new Error("Outreach not found");

  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + days);

  // Only set next follow-up date — don't increment count here
  // Count is incremented by processFollowUps when the follow-up is actually processed
  const updated = await prisma.outreach.update({
    where: { id: outreachId },
    data: {
      nextFollowUp,
    },
  });

  return updated;
}

/** Get outreach stats — sent, opened, replied, accepted rates */
export async function getOutreachStats() {
  const total = await prisma.outreach.count();
  const queued = await prisma.outreach.count({ where: { status: "queued" } });
  const sent = await prisma.outreach.count({ where: { status: "sent" } });
  const opened = await prisma.outreach.count({ where: { status: "opened" } });
  const replied = await prisma.outreach.count({ where: { status: "replied" } });
  const accepted = await prisma.outreach.count({ where: { status: "accepted" } });
  const rejected = await prisma.outreach.count({ where: { status: "rejected" } });

  const sentOrBeyond = sent + opened + replied + accepted + rejected;

  return {
    total,
    queued,
    sent,
    opened,
    replied,
    accepted,
    rejected,
    openRate: sentOrBeyond > 0
      ? Math.round(((opened + replied + accepted) / sentOrBeyond) * 10000) / 100
      : 0,
    replyRate: sentOrBeyond > 0
      ? Math.round(((replied + accepted) / sentOrBeyond) * 10000) / 100
      : 0,
    acceptRate: sentOrBeyond > 0
      ? Math.round((accepted / sentOrBeyond) * 10000) / 100
      : 0,
    pendingFollowUps: await prisma.outreach.count({
      where: {
        nextFollowUp: { lte: new Date() },
        status: { in: ["sent", "opened"] },
      },
    }),
  };
}
