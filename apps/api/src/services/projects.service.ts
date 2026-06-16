import { prisma } from '@nexum/shared';
import { indexProject, removeFromIndex } from './orama-index.service.js';

// Projects can be nested at most 3 levels deep: root (0) -> child (1) -> grandchild (2).
const MAX_PROJECT_DEPTH = 2;

async function getDepth(projectId: string): Promise<number> {
  let depth = 0;
  let current = await prisma.project.findUnique({
    where: { id: projectId },
    select: { parentId: true },
  });
  while (current?.parentId) {
    depth++;
    current = await prisma.project.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }
  return depth;
}

async function getDescendantIds(projectId: string): Promise<string[]> {
  const children = await prisma.project.findMany({
    where: { parentId: projectId },
    select: { id: true },
  });
  const childIds = children.map((c) => c.id);
  const nested = await Promise.all(childIds.map((childId) => getDescendantIds(childId)));
  return childIds.concat(...nested);
}

async function getSubtreeDepth(projectId: string): Promise<number> {
  const children = await prisma.project.findMany({
    where: { parentId: projectId },
    select: { id: true },
  });
  if (children.length === 0) return 0;
  const depths = await Promise.all(children.map((c) => getSubtreeDepth(c.id)));
  return 1 + Math.max(...depths);
}

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

export async function move(id: string, parentId: string | null) {
  if (parentId === id) {
    throw new Error('No puedes mover un proyecto dentro de sí mismo.');
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new Error('Proyecto no encontrado.');
  }

  if (parentId) {
    const target = await prisma.project.findUnique({ where: { id: parentId } });
    if (!target) {
      throw new Error('El proyecto destino no existe.');
    }

    const descendantIds = await getDescendantIds(id);
    if (descendantIds.includes(parentId)) {
      throw new Error('No puedes mover un proyecto dentro de uno de sus propios subproyectos.');
    }
  }

  const newDepth = parentId ? (await getDepth(parentId)) + 1 : 0;
  const subtreeDepth = await getSubtreeDepth(id);

  if (newDepth + subtreeDepth > MAX_PROJECT_DEPTH) {
    throw new Error('No se puede mover ahí: se superaría la profundidad máxima de subproyectos.');
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { parentId },
  });
  return updated;
}
