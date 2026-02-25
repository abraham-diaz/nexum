import { prisma } from '@nexum/shared';

export function findAll(projectId?: string) {
  return prisma.document.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export function findById(id: string) {
  return prisma.document.findUnique({ where: { id } });
}

export function create(title: string, projectId: string) {
  return prisma.document.create({ data: { title, projectId } });
}

export function update(id: string, data: { title?: string; content?: unknown }) {
  return prisma.document.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content as any }),
    },
  });
}

export function remove(id: string) {
  return prisma.document.delete({ where: { id } });
}
