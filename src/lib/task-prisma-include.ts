export const taskRelationInclude = {
  assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } as const },
  creator: { select: { id: true, name: true, image: true, color: true, emoji: true } as const },
};

export const columnWithTasksInclude = {
  tasks: {
    where: { completed: false },
    include: taskRelationInclude,
    orderBy: { order: "asc" as const },
  },
} as const;

export const boardFullInclude = {
  columns: {
    include: columnWithTasksInclude,
    orderBy: { order: "asc" as const },
  },
} as const;
