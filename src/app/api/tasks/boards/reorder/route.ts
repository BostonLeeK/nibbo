import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ids = body.orderedBoardIds as string[] | undefined;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "orderedBoardIds required" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((boardId, index) =>
      prisma.taskBoard.update({
        where: { id: boardId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
