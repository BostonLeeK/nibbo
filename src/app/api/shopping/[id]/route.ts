import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "item") {
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

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "list") {
    await prisma.shoppingList.delete({ where: { id } });
  } else {
    await prisma.shoppingItem.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
