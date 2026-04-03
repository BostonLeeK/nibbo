import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "item") {
    const exists = await prisma.shoppingItem.findFirst({
      where: { id, list: { familyId } },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await prisma.shoppingItem.update({
      where: { id },
      data: { checked: body.checked, name: body.name, quantity: body.quantity, unit: body.unit },
      include: {
        addedBy: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      },
    });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "list") {
    const exists = await prisma.shoppingList.findFirst({ where: { id, familyId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.shoppingList.delete({ where: { id } });
  } else {
    const exists = await prisma.shoppingItem.findFirst({
      where: { id, list: { familyId } },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.shoppingItem.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
