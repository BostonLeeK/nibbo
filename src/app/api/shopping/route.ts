import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
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

  const body = await req.json();

  if (body.type === "list") {
    const list = await prisma.shoppingList.create({
      data: {
        name: body.name,
        emoji: body.emoji || "🛒",
      },
      include: { items: true },
    });
    return NextResponse.json(list);
  }

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
