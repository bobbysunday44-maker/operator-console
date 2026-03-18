/* ── Outreach Email Templates ──
 * Cold outreach email sequences for the Outreach Bot.
 * Each template returns { subject, body } with placeholder values interpolated.
 *
 * Cadence:
 *   Day 0  — initialPitch
 *   Day 3  — followUp1 (gentle nudge)
 *   Day 7  — followUp2 (value-add with sample/case study)
 *   Day 14 — followUp3 (break-up)
 *   On accept — acceptedResponse (onboarding)
 *
 * Usage:
 *   import { initialPitch, followUp1 } from "@/lib/outreach/email-templates";
 *   const email = initialPitch("Acme Corp", "Nova", "tech gadgets", {
 *     followerCount: "250K",
 *     engagementRate: "8.2",
 *     contentPieces: "5",
 *   });
 */

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface PitchStats {
  followerCount: string;
  engagementRate: string;
  contentPieces: string;
}

// ── Day 0: Initial Cold Pitch ──
export function initialPitch(
  businessName: string,
  characterName: string,
  niche: string,
  stats: PitchStats,
): EmailTemplate {
  return {
    subject: `${businessName} + ${characterName} — content partnership (commission-only)`,
    body: `Hi {{business_name}} team,

I'm reaching out because I think there's a strong fit between what you're building and what our AI creator {{character_name}} does best.

Quick context: {{character_name}} is an AI-generated content creator in the {{niche}} space with {{follower_count}} followers and a {{engagement_rate}}% engagement rate across TikTok, Instagram, and YouTube. We create short-form video content — product showcases, tutorials, lifestyle integrations — that drives real purchases.

Here's what I'm proposing:

We'll produce {{content_pieces}} pieces of high-quality video content featuring your products. Each video is scripted, shot, and edited by our content factory — you don't lift a finger. The content goes live on {{character_name}}'s channels with direct links to your store.

The best part: zero upfront cost. We work on commission only — you pay a percentage on sales we drive, tracked via unique affiliate links. If we don't drive sales, you pay nothing.

Why this works:
- Our content consistently outperforms traditional influencer posts because we control every variable — timing, hooks, visuals, CTAs
- Commission alignment means we're incentivized to create content that actually converts, not just looks good
- You get professional video content for your own channels as part of the deal

Would you be open to a quick 15-minute call this week to see if there's a fit?

Best,
OpenClaw Outreach
https://openclaw.ai`
      .replace(/\{\{business_name\}\}/g, businessName)
      .replace(/\{\{character_name\}\}/g, characterName)
      .replace(/\{\{niche\}\}/g, niche)
      .replace(/\{\{follower_count\}\}/g, stats.followerCount)
      .replace(/\{\{engagement_rate\}\}/g, stats.engagementRate)
      .replace(/\{\{content_pieces\}\}/g, stats.contentPieces),
  };
}

// ── Day 3: Gentle Follow-Up ──
export function followUp1(
  businessName: string,
  characterName: string,
): EmailTemplate {
  return {
    subject: `Re: ${businessName} + ${characterName} — quick follow-up`,
    body: `Hi {{business_name}} team,

Just bumping this to the top of your inbox — I know things get busy.

To recap: we'd create video content featuring your products on {{character_name}}'s channels (TikTok, Instagram, YouTube) at zero upfront cost. You only pay commission on sales we actually drive.

No long contracts, no risk. If the first batch doesn't perform, we part ways — no hard feelings.

Worth a 15-minute call?

Best,
OpenClaw Outreach`
      .replace(/\{\{business_name\}\}/g, businessName)
      .replace(/\{\{character_name\}\}/g, characterName),
  };
}

// ── Day 7: Value-Add Follow-Up ──
export function followUp2(
  businessName: string,
  characterName: string,
): EmailTemplate {
  return {
    subject: `${characterName} sample content for ${businessName}`,
    body: `Hi {{business_name}} team,

Instead of another follow-up email, I wanted to show rather than tell.

I had our team put together a sample content concept for {{business_name}} — here's what a {{character_name}} video featuring your products could look like:

[SAMPLE CONTENT BRIEF ATTACHED]

This is the level of production quality and strategic thinking we bring to every piece. The hook is designed for maximum scroll-stop, the product integration feels natural, and the CTA drives directly to your store.

A few recent results from similar partnerships:
- Average 3.2x ROAS on commission-based campaigns
- 85% of partner businesses renew after the first content batch
- Content is yours to repurpose on your own channels at no extra cost

If this resonates, I'd love to hop on a quick call to discuss specifics — commission structure, content themes, posting schedule.

Best,
OpenClaw Outreach`
      .replace(/\{\{business_name\}\}/g, businessName)
      .replace(/\{\{character_name\}\}/g, characterName),
  };
}

// ── Day 14: Break-Up Email ──
export function followUp3(businessName: string): EmailTemplate {
  return {
    subject: `Closing the loop — ${businessName}`,
    body: `Hi {{business_name}} team,

I've reached out a few times and haven't heard back, so I'll assume the timing isn't right. Totally understand — not every opportunity aligns.

I'm going to close this thread on my end, but if AI-powered content creation ever becomes relevant for {{business_name}}, my inbox is open. We're constantly improving our models and expanding our creator roster, so the offering only gets better.

No hard feelings, and I wish you all the best.

Cheers,
OpenClaw Outreach`
      .replace(/\{\{business_name\}\}/g, businessName),
  };
}

// ── On Accept: Onboarding Email ──
export function acceptedResponse(
  businessName: string,
  characterName: string,
): EmailTemplate {
  return {
    subject: `Welcome aboard, ${businessName} — let's get started`,
    body: `Hi {{business_name}} team,

Thrilled to have you on board. Let's make this partnership drive real results.

Here's what happens next:

1. PRODUCT BRIEF (Today)
   Send us 3-5 products you'd like featured first. Include product links, any key selling points, and target audience notes. The more context, the better our content performs.

2. AFFILIATE SETUP (Within 48 hours)
   We'll set up unique tracking links for {{character_name}}'s content so every sale is accurately attributed. We'll share the links for your approval before anything goes live.

3. CONTENT CREATION (Days 3-7)
   Our content factory — scripting, image generation, video production, voiceover, and editing — produces the first batch. You'll get a preview of each piece before it's published.

4. REVIEW & APPROVAL (Day 7-8)
   You review the content. Request revisions if needed — we want you 100% happy before anything goes live.

5. PUBLISHING (Day 9+)
   Content goes live on {{character_name}}'s TikTok, Instagram, and YouTube at optimized posting times. You'll receive performance reports weekly.

COMMISSION STRUCTURE:
- Standard rate: negotiated per partnership
- Tracking: unique affiliate links per video
- Payment: monthly, net-30 from sale date
- Reporting: weekly performance dashboard access

One last thing — all content we create is yours to repurpose on your own channels. Consider it a bonus asset library.

Looking forward to creating something great together.

Best,
OpenClaw Outreach`
      .replace(/\{\{business_name\}\}/g, businessName)
      .replace(/\{\{character_name\}\}/g, characterName),
  };
}

// ── Template Metadata (for tracking/optimization) ──
export const EMAIL_CADENCE = [
  { name: "initial_pitch", dayOffset: 0, generator: "initialPitch" },
  { name: "follow_up_1", dayOffset: 3, generator: "followUp1" },
  { name: "follow_up_2", dayOffset: 7, generator: "followUp2" },
  { name: "follow_up_3", dayOffset: 14, generator: "followUp3" },
] as const;

export type CadenceStep = (typeof EMAIL_CADENCE)[number]["name"];
