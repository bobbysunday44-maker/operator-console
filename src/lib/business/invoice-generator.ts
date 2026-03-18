/* ── Invoice Generator ──
 * Generates invoice objects from campaign performance data.
 * Calculates commission from RevenueEvent records within a period.
 *
 * Usage:
 *   import { generateInvoice, getInvoicePreview } from "@/lib/business/invoice-generator";
 *   const invoice = await generateInvoice(campaignId, new Date("2026-03-01"), new Date("2026-03-15"));
 */

import { prisma } from "@/lib/db/prisma";

// ── Types ──

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  invoiceNumber: string;
  campaignId: string;
  businessName: string;
  businessEmail: string | null;
  period: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "final";
  generatedAt: string;
  campaignNiche: string;
  commissionRate: number;
}

// ── Invoice Number Generation (persisted via DB) ──

async function generateInvoiceNumber(): Promise<string> {
  // Count existing invoices in activity log to get next number
  const count = await prisma.activityLog.count({
    where: { message: { startsWith: "Invoice generated: OC-" } },
  });
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(3, "0");
  return `OC-${year}-${num}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

// ── Core Functions ──

/**
 * Generate an invoice for a campaign over a specific period.
 * Calculates from RevenueEvent records and content production.
 * Returns the invoice object (not saved to DB).
 */
export async function generateInvoice(
  campaignId: string,
  periodStart: Date,
  periodEnd: Date,
  status: "draft" | "final" = "draft"
): Promise<Invoice> {
  try {
    // 1. Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    // 2. Get affiliate links for this campaign
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { campaign: campaign.businessName },
          { niche: campaign.niche, campaign: campaign.businessName },
        ],
      },
    });
    const affiliateLinkIds = affiliateLinks.map((l) => l.id);

    // 3. Get revenue events in the period
    let saleEvents: Array<{ type: string; amount: number }> = [];
    let clickEvents = 0;

    if (affiliateLinkIds.length > 0) {
      const events = await prisma.revenueEvent.findMany({
        where: {
          affiliateLinkId: { in: affiliateLinkIds },
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      saleEvents = events.filter((e) => e.type === "sale");
      clickEvents = events.filter((e) => e.type === "click").length;
    }

    const totalSaleRevenue = saleEvents.reduce((sum, e) => sum + e.amount, 0);
    const saleCount = saleEvents.length;

    // 4. Count content created in the period
    const contentCount = await prisma.contentItem.count({
      where: {
        niche: campaign.niche,
        status: { in: ["published", "approved"] },
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // 5. Build invoice line items
    const items: InvoiceLineItem[] = [];

    // Content creation line item
    if (contentCount > 0) {
      const contentRate = campaign.commission > 0
        ? Math.round(totalSaleRevenue * campaign.commission * 0.3 / Math.max(contentCount, 1) * 100) / 100
        : 0;
      items.push({
        description: `Content creation (${contentCount} ${contentCount === 1 ? "video" : "videos"})`,
        quantity: contentCount,
        rate: contentRate,
        amount: Math.round(contentRate * contentCount * 100) / 100,
      });
    }

    // Commission on sales
    if (saleCount > 0) {
      const commissionPerSale = totalSaleRevenue > 0
        ? Math.round(totalSaleRevenue * campaign.commission / saleCount * 100) / 100
        : 0;
      items.push({
        description: `Commission on sales (${saleCount} ${saleCount === 1 ? "conversion" : "conversions"})`,
        quantity: saleCount,
        rate: commissionPerSale,
        amount: Math.round(totalSaleRevenue * campaign.commission * 100) / 100,
      });
    }

    // Clicks tracked (informational, no charge)
    if (clickEvents > 0) {
      items.push({
        description: `Affiliate link clicks tracked`,
        quantity: clickEvents,
        rate: 0,
        amount: 0,
      });
    }

    // If no items at all, add a zero-line summary
    if (items.length === 0) {
      items.push({
        description: `Campaign management — ${campaign.businessName} (${campaign.niche})`,
        quantity: 1,
        rate: 0,
        amount: 0,
      });
    }

    // 6. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = 0; // No tax calculation for now
    const total = Math.round((subtotal + tax) * 100) / 100;

    // 7. Build invoice
    const invoice: Invoice = {
      invoiceNumber: await generateInvoiceNumber(),
      campaignId: campaign.id,
      businessName: campaign.businessName,
      businessEmail: campaign.businessEmail,
      period: formatPeriod(periodStart, periodEnd),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      status,
      generatedAt: new Date().toISOString(),
      campaignNiche: campaign.niche,
      commissionRate: campaign.commission,
    };

    // Log if final
    if (status === "final") {
      await prisma.activityLog.create({
        data: {
          type: "success",
          message: `Invoice ${invoice.invoiceNumber} generated for ${campaign.businessName}: $${total.toFixed(2)}`,
          source: "system",
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            campaignId,
            total,
            period: invoice.period,
          },
        },
      });
    }

    return invoice;
  } catch (err) {
    console.error("[InvoiceGenerator] generateInvoice failed:", err);
    throw err;
  }
}

/**
 * Preview what the next invoice would look like.
 * Uses the current month as the period.
 */
export async function getInvoicePreview(campaignId: string): Promise<Invoice> {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return generateInvoice(campaignId, periodStart, periodEnd, "draft");
  } catch (err) {
    console.error("[InvoiceGenerator] getInvoicePreview failed:", err);
    throw err;
  }
}
