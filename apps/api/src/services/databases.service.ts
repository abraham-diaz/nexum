import { prisma } from '@nexum/shared';

export function findAll() {
  return prisma.database.findMany({
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

export function create(name: string) {
  return prisma.database.create({ data: { name } });
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
