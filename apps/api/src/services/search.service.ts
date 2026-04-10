import { prisma } from '@nexum/shared';
import { searchIndex } from './orama-index.service.js';

export async function search(query: string) {
  const hits = await searchIndex(query, 30);

  const projectIds = hits.filter((h) => h.type === 'project').map((h) => h.entityId);
  const databaseIds = hits.filter((h) => h.type === 'database').map((h) => h.entityId);
  const documentIds = hits.filter((h) => h.type === 'document').map((h) => h.entityId);

  const [projects, databases, documents] = await Promise.all([
    projectIds.length > 0
      ? prisma.project.findMany({ where: { id: { in: projectIds } }, take: 10, orderBy: { updatedAt: 'desc' } })
      : [],
    databaseIds.length > 0
      ? prisma.database.findMany({ where: { id: { in: databaseIds } }, take: 10, orderBy: { updatedAt: 'desc' } })
      : [],
    documentIds.length > 0
      ? prisma.document.findMany({ where: { id: { in: documentIds } }, take: 10, orderBy: { updatedAt: 'desc' } })
      : [],
  ]);

  return { projects, databases, documents };
}
