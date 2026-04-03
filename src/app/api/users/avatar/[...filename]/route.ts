import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decodeBlobPath } from "@/lib/blob-path";
import { ensureUserFamily } from "@/lib/family";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return new NextResponse(null, { status: 401 });

  const { filename } = await params;
  const token = Array.isArray(filename) ? filename.join("/") : filename;
  const pathname = decodeBlobPath(token);
  if (!pathname) return new NextResponse(null, { status: 404 });
  const segments = pathname.split("/");
  if (segments.length < 4 || segments[0] !== "avatars") return new NextResponse(null, { status: 404 });
  if (segments[1] !== familyId) return new NextResponse(null, { status: 403 });

  try {
    const blob = await get(pathname, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return new NextResponse(null, { status: 404 });
    return new NextResponse(blob.stream, {
      status: 200,
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
