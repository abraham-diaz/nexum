import { prisma } from '@nexum/shared';

export function upsert(rowId: string, propertyId: string, value: unknown) {
  return prisma.cell.upsert({
    where: { rowId_propertyId: { rowId, propertyId } },
    update: { value: value as any },
    create: { rowId, propertyId, value: value as any },
  });
}

export function remove(rowId: string, propertyId: string) {
  return prisma.cell.delete({
    where: { rowId_propertyId: { rowId, propertyId } },
  });
}
