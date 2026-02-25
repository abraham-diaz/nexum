import { prisma, type PropertyType } from '@nexum/shared';

export function findAll(databaseId: string) {
  return prisma.property.findMany({
    where: { databaseId },
    orderBy: { order: 'asc' },
  });
}

export function create(data: {
  databaseId: string;
  name: string;
  type: PropertyType;
  order?: number;
  config?: unknown;
  relationDatabaseId?: string;
}) {
  return prisma.property.create({
    data: {
      name: data.name,
      type: data.type,
      order: data.order ?? 0,
      config: data.config as any,
      relationDatabaseId: data.relationDatabaseId,
      databaseId: data.databaseId,
    },
  });
}

export function update(id: string, data: { name?: string; order?: number; config?: unknown }) {
  return prisma.property.update({
    where: { id },
    data: { name: data.name, order: data.order, config: data.config as any },
  });
}

export function remove(id: string) {
  return prisma.property.delete({ where: { id } });
}
