import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getCurrentFamilyUser(userId: string, familyId: string) {
  return prisma.user.findFirst({
    where: { id: userId, familyId },
    select: { id: true, familyId: true, familyRole: true },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await getCurrentFamilyUser(session.user.id, familyId);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { id: true, name: true },
  });

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { familyId },
      select: { id: true, name: true, email: true, image: true, color: true, emoji: true, familyRole: true },
      orderBy: { name: "asc" },
    }),
    prisma.familyInvitation.findMany({
      where: { familyId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    family,
    members,
    invitations,
    currentUserRole: currentUser.familyRole,
    currentUserId: currentUser.id,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await getCurrentFamilyUser(session.user.id, familyId);
  if (!currentUser || currentUser.familyRole !== "OWNER") {
    return NextResponse.json({ error: "Only owner can invite" }, { status: 403 });
  }
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true, familyId: true },
  });

  if (existingUser?.familyId && existingUser.familyId !== familyId) {
    return NextResponse.json({ error: "User already belongs to another family" }, { status: 409 });
  }

  const invite = await prisma.familyInvitation.upsert({
    where: { familyId_email: { familyId, email } },
    update: { invitedById: session.user.id, acceptedAt: null },
    create: { familyId, invitedById: session.user.id, email },
    select: { id: true, email: true, createdAt: true },
  });

  if (existingUser && !existingUser.familyId) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { familyId, familyRole: "MEMBER" },
    });
    await prisma.familyInvitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  }

  return NextResponse.json(invite);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const currentUser = await getCurrentFamilyUser(session.user.id, familyId);
  if (body.memberId && String(body.memberId) === session.user.id) {
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (currentUser.familyRole === "OWNER") {
      return NextResponse.json({ error: "Owner cannot leave family" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: null, familyRole: "MEMBER" },
    });
    return NextResponse.json({ success: true });
  }

  if (!currentUser || currentUser.familyRole !== "OWNER") {
    return NextResponse.json({ error: "Only owner can manage family" }, { status: 403 });
  }
  if (body.inviteId) {
    await prisma.familyInvitation.deleteMany({
      where: { id: String(body.inviteId), familyId, acceptedAt: null },
    });
    return NextResponse.json({ success: true });
  }

  if (!body.memberId) return NextResponse.json({ error: "memberId or inviteId required" }, { status: 400 });
  const memberId = String(body.memberId);
  if (memberId === session.user.id) {
    return NextResponse.json({ error: "Owner cannot remove self" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: memberId, familyId },
    select: { id: true, familyRole: true },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: target.id },
    data: { familyId: null, familyRole: "MEMBER" },
  });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await getCurrentFamilyUser(session.user.id, familyId);
  if (!currentUser || currentUser.familyRole !== "OWNER") {
    return NextResponse.json({ error: "Only owner can transfer ownership" }, { status: 403 });
  }

  const body = await req.json();
  const nextOwnerId = String(body.ownerId || "");
  if (!nextOwnerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });
  if (nextOwnerId === session.user.id) return NextResponse.json({ success: true });

  const nextOwner = await prisma.user.findFirst({
    where: { id: nextOwnerId, familyId },
    select: { id: true },
  });
  if (!nextOwner) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.updateMany({ where: { familyId, familyRole: "OWNER" }, data: { familyRole: "MEMBER" } }),
    prisma.user.update({ where: { id: nextOwner.id }, data: { familyRole: "OWNER" } }),
  ]);

  return NextResponse.json({ success: true });
}
