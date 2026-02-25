import { prisma } from '@nexum/shared';

export function findAll(parentId?: string | null) {
  return prisma.project.findMany({
    where: { parentId: parentId ?? null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { databases: true, children: true } },
    },
  });
}

export function findById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { databases: true, children: true } } },
      },
      databases: { orderBy: { createdAt: 'desc' } },
      parent: { select: { id: true, name: true, parentId: true } },
    },
  });
}

export function create(name: string, parentId?: string) {
  return prisma.project.create({
    data: { name, parentId: parentId ?? null },
  });
}

export function update(id: string, name: string) {
  return prisma.project.update({
    where: { id },
    data: { name },
  });
}

export function remove(id: string) {
  return prisma.project.delete({ where: { id } });
}
