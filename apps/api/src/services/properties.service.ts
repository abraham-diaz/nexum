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

export async function update(
  id: string,
  data: {
    name?: string;
    order?: number;
    config?: unknown;
    renameMap?: { from: string; to: string }[];
  }
) {
  if (data.renameMap?.length) {
    const cells = await prisma.cell.findMany({ where: { propertyId: id } });
    for (const { from, to } of data.renameMap) {
      if (from === to) continue;
      const affected = cells.filter((c) => c.value === from);
      await Promise.all(
        affected.map((c) => prisma.cell.update({ where: { id: c.id }, data: { value: to } }))
      );
    }
  }

  return prisma.property.update({
    where: { id },
    data: { name: data.name, order: data.order, config: data.config as any },
  });
}

export function remove(id: string) {
  return prisma.property.delete({ where: { id } });
}
