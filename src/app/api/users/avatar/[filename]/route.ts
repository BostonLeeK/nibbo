import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SAFE_NAME =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpe?g|png|webp|gif)$/i;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  if (!SAFE_NAME.test(decoded) || decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(decoded).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) return new NextResponse(null, { status: 404 });

  const filePath = path.join(process.cwd(), "public", "uploads", "avatars", decoded);
  const resolved = path.resolve(filePath);
  const root = path.resolve(process.cwd(), "public", "uploads", "avatars");
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buf = await readFile(resolved);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
