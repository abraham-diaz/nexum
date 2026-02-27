import { prisma } from '@nexum/shared';

export function search(query: string) {
  const filter = { contains: query, mode: 'insensitive' as const };

  return Promise.all([
    prisma.project.findMany({
      where: { name: filter },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.database.findMany({
      where: { name: filter },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.document.findMany({
      where: { title: filter },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    }),
  ]).then(([projects, databases, documents]) => ({
    projects,
    databases,
    documents,
  }));
}
