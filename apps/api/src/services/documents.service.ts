import { prisma } from '@nexum/shared';
import { indexDocument, removeFromIndex } from './orama-index.service.js';

export function findAll(projectId?: string) {
  return prisma.document.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export function findById(id: string) {
  return prisma.document.findUnique({ where: { id } });
}

export async function create(title: string, projectId: string) {
  const doc = await prisma.document.create({ data: { title, projectId } });
  indexDocument(doc.id, doc.title, doc.content, doc.projectId).catch(() => {});
  return doc;
}

export async function update(id: string, data: { title?: string; content?: unknown }) {
  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content as any }),
    },
  });
  indexDocument(doc.id, doc.title, doc.content, doc.projectId).catch(() => {});
  return doc;
}

export async function remove(id: string) {
  const doc = await prisma.document.delete({ where: { id } });
  removeFromIndex(id).catch(() => {});
  return doc;
}
