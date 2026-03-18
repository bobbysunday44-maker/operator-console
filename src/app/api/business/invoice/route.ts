/* ── Invoice API ──
 * GET ?campaignId=X&start=Y&end=Z — returns invoice preview
 * POST { campaignId, periodStart, periodEnd } — generates final invoice
 */

import { NextResponse } from "next/server";
import { generateInvoice, getInvoicePreview } from "@/lib/business/invoice-generator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId query parameter is required" },
        { status: 400 }
      );
    }

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // If start/end provided, generate for that period; otherwise preview current month
    if (start && end) {
      const periodStart = new Date(start);
      const periodEnd = new Date(end);

      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return NextResponse.json(
          { error: "Invalid start or end date format. Use ISO 8601 (e.g., 2026-03-01)" },
          { status: 400 }
        );
      }

      if (periodStart >= periodEnd) {
        return NextResponse.json(
          { error: "start must be before end" },
          { status: 400 }
        );
      }

      const invoice = await generateInvoice(campaignId, periodStart, periodEnd, "draft");
      return NextResponse.json({ invoice });
    }

    // Default: preview for current month
    const invoice = await getInvoicePreview(campaignId);
    return NextResponse.json({ invoice });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate invoice preview" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaignId = body.campaignId;
  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  try {
    let periodStart: Date;
    let periodEnd: Date;

    if (body.periodStart && body.periodEnd) {
      periodStart = new Date(body.periodStart as string);
      periodEnd = new Date(body.periodEnd as string);

      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return NextResponse.json(
          { error: "Invalid periodStart or periodEnd date format" },
          { status: 400 }
        );
      }
    } else {
      // Default to current month
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const invoice = await generateInvoice(campaignId, periodStart, periodEnd, "final");
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
