import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    where: { familyId },
    include: {
      items: {
        include: {
          addedBy: { select: { id: true, name: true, image: true, color: true, emoji: true } },
        },
        orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "list") {
    const list = await prisma.shoppingList.create({
      data: {
        name: body.name,
        emoji: body.emoji || "shopping",
        familyId,
      },
      include: { items: true },
    });
    return NextResponse.json(list);
  }

  const list = await prisma.shoppingList.findFirst({
    where: { id: body.listId, familyId },
    select: { id: true },
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const item = await prisma.shoppingItem.create({
    data: {
      name: body.name,
      quantity: body.quantity,
      unit: body.unit,
      category: body.category,
      listId: body.listId,
      addedById: session.user.id,
    },
    include: {
      addedBy: { select: { id: true, name: true, image: true, color: true, emoji: true } },
    },
  });

  return NextResponse.json(item);
}
