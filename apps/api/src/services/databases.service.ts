import { prisma } from '@nexum/shared';
import type { Prisma } from '@nexum/shared';
import { DATABASE_TEMPLATES } from '../templates/database-templates.js';
import { indexDatabase, removeFromIndex } from './orama-index.service.js';

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
  return prisma.$transaction(async (tx) => {
    const database = await tx.database.create({ data: { name, projectId } });
    await tx.property.createMany({
      data: [
        { databaseId: database.id, name: 'Título', type: 'TEXT', order: 0 },
        { databaseId: database.id, name: 'Descripción', type: 'TEXT', order: 1 },
      ],
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
        config: (p.config ?? null) as Prisma.InputJsonValue | null,
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

export async function update(id: string, name: string) {
  const db = await prisma.database.update({
    where: { id },
    data: { name },
    include: { properties: { select: { name: true } } },
  });
  indexDatabase(db.id, db.name, db.projectId, db.properties.map((p) => p.name)).catch(() => {});
  return db;
}

export async function remove(id: string) {
  const db = await prisma.database.delete({ where: { id } });
  removeFromIndex(id).catch(() => {});
  return db;
}

export function getTemplates() {
  return DATABASE_TEMPLATES;
}
