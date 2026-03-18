/* GET /api/files?path=... — Serve a file from the content archive
 * Only serves files from the configured CONTENT_ARCHIVE_PATH.
 */

import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { resolve, normalize } from "path";
import { getSetting } from "@/lib/db/settings";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".txt": "text/plain",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path parameter required" }, { status: 400 });
  }

  const archiveBase = resolve((await getSetting("CONTENT_ARCHIVE_PATH")) || "./content-archive");
  const fullPath = resolve(archiveBase, filePath);

  // Prevent path traversal
  if (!normalize(fullPath).startsWith(normalize(archiveBase))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    await stat(fullPath);
    const data = await readFile(fullPath);
    const ext = fullPath.substring(fullPath.lastIndexOf(".")).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
