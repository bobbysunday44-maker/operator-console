/* GET /api/archive — List archived content
 * Query: ?status=complete|processing|failed|archived&type=video|image|text|carousel&search=keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { archiveStore } from "@/lib/archive/archive-store";
import type { ContentStatus, MediaType } from "@/lib/archive/types";

const VALID_STATUSES = new Set<ContentStatus>(["complete", "processing", "failed", "archived"]);
const VALID_TYPES = new Set<MediaType>(["video", "image", "text", "carousel"]);

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const rawType = request.nextUrl.searchParams.get("type");
  const search = request.nextUrl.searchParams.get("search") || undefined;
  const rawView = request.nextUrl.searchParams.get("view");

  if (rawView === "stats") {
    return NextResponse.json(archiveStore.getStats());
  }

  const filters: { status?: ContentStatus; mediaType?: MediaType; search?: string } = {};
  if (rawStatus && VALID_STATUSES.has(rawStatus as ContentStatus)) filters.status = rawStatus as ContentStatus;
  if (rawType && VALID_TYPES.has(rawType as MediaType)) filters.mediaType = rawType as MediaType;
  if (search) filters.search = search;

  const items = archiveStore.listItems(Object.keys(filters).length > 0 ? filters : undefined);
  return NextResponse.json({ items });
}
