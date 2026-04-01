import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const events = await prisma.event.findMany({
    where: {
      startDate: from ? { gte: new Date(from) } : undefined,
      endDate: to ? { lte: new Date(to) } : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description,
      emoji: body.emoji || "📅",
      color: body.color || "#8b5cf6",
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      allDay: body.allDay || false,
      weeklyRepeat: Boolean(body.weeklyRepeat),
      weeklyDay: body.weeklyRepeat ? Number(body.weeklyDay) : null,
      location: body.location,
      assigneeId: body.assigneeId || undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
    },
  });

  return NextResponse.json(event);
}
