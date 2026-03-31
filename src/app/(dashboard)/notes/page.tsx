import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotesView from "@/components/notes/NotesView";

export default async function NotesPage() {
  const session = await auth();
  if (!session) return null;

  const notes = await prisma.note.findMany({
    include: { author: { select: { id: true, name: true, image: true, color: true, emoji: true } } },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  const initialNotes = notes.map((n) => ({
    ...n,
    updatedAt: n.updatedAt.toISOString(),
  }));

  return <NotesView initialNotes={initialNotes} currentUserId={session.user.id} />;
}
