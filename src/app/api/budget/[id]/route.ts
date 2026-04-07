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
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const body = await req.json();

  if (type !== "category") {
    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }

  const exists = await prisma.expenseCategory.findFirst({ where: { id, familyId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: {
      name: body.name,
      emoji: body.emoji,
      color: body.color,
      budget: body.budget ?? null,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "category") {
    const exists = await prisma.expenseCategory.findFirst({ where: { id, familyId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.expenseCategory.delete({ where: { id } });
  } else if (type === "income") {
    const exists = await prisma.income.findFirst({ where: { id, familyId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.income.delete({ where: { id } });
  } else {
    const exists = await prisma.expense.findFirst({ where: { id, familyId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.expense.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
