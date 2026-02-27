import { prisma } from '@nexum/shared';
import type { Prisma } from '@nexum/shared';

export function findAll(databaseId: string) {
  return prisma.row.findMany({
    where: { databaseId },
    orderBy: { order: 'asc' },
    include: {
      cells: { include: { property: true } },
    },
  });
}

export function create(data: {
  databaseId: string;
  order?: number;
  cells?: { propertyId: string; value: unknown }[];
}) {
  return prisma.row.create({
    data: {
      databaseId: data.databaseId,
      order: data.order ?? 0,
      ...(data.cells && {
        cells: {
          create: data.cells.map((c) => ({
            propertyId: c.propertyId,
            value: (c.value ?? null) as Prisma.InputJsonValue | null,
          })),
        },
      }),
    },
    include: { cells: true },
  });
}

export function update(id: string, order: number) {
  return prisma.row.update({
    where: { id },
    data: { order },
  });
}

export function remove(id: string) {
  return prisma.row.delete({ where: { id } });
}

export function reorder(orderedIds: string[]) {
  return prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.row.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}
