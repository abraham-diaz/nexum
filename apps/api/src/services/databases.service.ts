import { prisma, Prisma } from '@nexum/shared';
import { DATABASE_TEMPLATES } from '../templates/database-templates.js';

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

export function createFromTemplate(name: string, projectId: string, templateId: string) {
  const template = DATABASE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Template "${templateId}" not found`);

  return prisma.$transaction(async (tx) => {
    const database = await tx.database.create({
      data: {
        name,
        projectId,
        viewType: template.defaultViewType,
      },
    });

    await tx.property.createMany({
      data: template.properties.map((p) => ({
        databaseId: database.id,
        name: p.name,
        type: p.type,
        order: p.order,
        config: (p.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      })),
    });

    return tx.database.findUnique({
      where: { id: database.id },
      include: {
        properties: { orderBy: { order: 'asc' } },
        _count: { select: { rows: true } },
      },
    });
  });
}

export function updateViewType(id: string, viewType: 'TABLE' | 'BOARD') {
  return prisma.database.update({
    where: { id },
    data: { viewType },
  });
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

export function getTemplates() {
  return DATABASE_TEMPLATES;
}
