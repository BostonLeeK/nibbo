import { auth } from "@/lib/auth";
import { encodeBlobPath } from "@/lib/blob-path";
import { ensureUserFamily } from "@/lib/family";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const mime = file.type;
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF" }, { status: 400 });
  }

  const pathname = `recipes/${familyId}/${session.user.id}/${randomUUID()}${ext}`;
  const blob = await put(pathname, file, { access: "private" });
  const token = encodeBlobPath(blob.pathname);
  return NextResponse.json({ url: `/api/recipes/image/${token}` });
}
