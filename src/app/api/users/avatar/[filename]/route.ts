import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decodeBlobPath } from "@/lib/blob-path";
import { ensureUserFamily } from "@/lib/family";
import { head } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return new NextResponse(null, { status: 401 });

  const { filename } = await params;
  const pathname = decodeBlobPath(filename);
  if (!pathname) return new NextResponse(null, { status: 404 });
  const segments = pathname.split("/");
  if (segments.length < 4 || segments[0] !== "avatars") return new NextResponse(null, { status: 404 });
  if (segments[1] !== familyId) return new NextResponse(null, { status: 403 });

  try {
    const info = await head(pathname);
    const response = await fetch(info.url, { cache: "no-store" });
    if (!response.ok) return new NextResponse(null, { status: 404 });
    const buf = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": info.contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
