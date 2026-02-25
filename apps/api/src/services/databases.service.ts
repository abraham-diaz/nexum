import { prisma } from '@nexum/shared';

export function findAll(projectId?: string) {
  return prisma.database.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export function findById(id: string) {
  return prisma.database.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { order: 'asc' } },
      _count: { select: { rows: true } },
    },
  });
}

export function create(name: string, projectId: string) {
  return prisma.database.create({ data: { name, projectId } });
}

export function update(id: string, name: string) {
  return prisma.database.update({
    where: { id },
    data: { name },
  });
}

export function remove(id: string) {
  return prisma.database.delete({ where: { id } });
}
