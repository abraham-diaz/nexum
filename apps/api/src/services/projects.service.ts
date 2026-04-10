import { prisma } from '@nexum/shared';
import { indexProject, removeFromIndex } from './orama-index.service.js';

export function findAll(parentId?: string | null) {
  return prisma.project.findMany({
    where: { parentId: parentId ?? null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { databases: true, children: true, documents: true } },
    },
  });
}

export function findById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { databases: true, children: true, documents: true } } },
      },
      databases: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      parent: { select: { id: true, name: true, parentId: true } },
    },
  });
}

export async function create(name: string, parentId?: string) {
  const project = await prisma.project.create({
    data: { name, parentId: parentId ?? null },
  });
  indexProject(project.id, project.name).catch(() => {});
  return project;
}

export async function update(id: string, name: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { name },
  });
  indexProject(project.id, project.name).catch(() => {});
  return project;
}

export async function remove(id: string) {
  const project = await prisma.project.delete({ where: { id } });
  removeFromIndex(id).catch(() => {});
  return project;
}
