import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShoppingView from "@/components/shopping/ShoppingView";

export default async function ShoppingPage() {
  const session = await auth();
  if (!session) return null;

  const lists = await prisma.shoppingList.findMany({
    include: {
      items: {
        include: { addedBy: { select: { id: true, name: true, image: true, color: true, emoji: true } } },
        orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <ShoppingView initialLists={lists} currentUserId={session.user.id} />;
}
