import { create, insert, remove, search, type AnyOrama } from '@orama/orama';
import { prisma } from '@nexum/shared';

// --- Orama schema & instance ---

let db: AnyOrama | null = null;

async function getDb() {
  if (!db) {
    db = await create({
      schema: {
        type: 'string',       // 'project' | 'database' | 'document'
        entityId: 'string',   // original DB id
        title: 'string',      // name / title
        body: 'string',       // extracted text content
        projectId: 'string',  // parent project id (empty for projects)
      },
    });
  }
  return db;
}

// --- Tiptap JSON → plain text ---

function tiptapToText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;

  let text = '';
  if (typeof n.text === 'string') text += n.text;
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      text += tiptapToText(child) + ' ';
    }
  }
  return text;
}

// --- Full reindex from DB ---

export async function buildIndex() {
  const instance = await getDb();

  const [projects, databases, documents, cells] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.database.findMany({
      select: { id: true, name: true, projectId: true, properties: { select: { name: true } } },
    }),
    prisma.document.findMany({
      select: { id: true, title: true, content: true, projectId: true },
    }),
    prisma.cell.findMany({
      where: { property: { type: 'TEXT' } },
      select: { value: true, row: { select: { id: true, databaseId: true, database: { select: { projectId: true } } } }, propertyId: true, rowId: true },
    }),
  ]);

  // Index projects
  for (const p of projects) {
    await insert(instance, {
      type: 'project',
      entityId: p.id,
      title: p.name,
      body: '',
      projectId: '',
    });
  }

  // Index databases (name + property names as body)
  for (const d of databases) {
    const propNames = d.properties.map((p) => p.name).join(' ');
    await insert(instance, {
      type: 'database',
      entityId: d.id,
      title: d.name,
      body: propNames,
      projectId: d.projectId,
    });
  }

  // Index documents (title + full text content)
  for (const doc of documents) {
    const body = doc.content ? tiptapToText(doc.content) : '';
    await insert(instance, {
      type: 'document',
      entityId: doc.id,
      title: doc.title,
      body,
      projectId: doc.projectId,
    });
  }

  // Index cell values grouped by row
  const rowMap = new Map<string, { databaseId: string; projectId: string; texts: string[] }>();
  for (const cell of cells) {
    const val = typeof cell.value === 'string' ? cell.value : '';
    if (!val) continue;
    const existing = rowMap.get(cell.rowId);
    if (existing) {
      existing.texts.push(val);
    } else {
      rowMap.set(cell.rowId, {
        databaseId: cell.row.databaseId,
        projectId: cell.row.database.projectId,
        texts: [val],
      });
    }
  }
  for (const [rowId, data] of rowMap) {
    await insert(instance, {
      type: 'row',
      entityId: rowId,
      title: '',
      body: data.texts.join(' '),
      projectId: data.projectId,
    });
  }

  console.log(
    `[Orama] Indexed: ${projects.length} projects, ${databases.length} databases, ${documents.length} documents, ${rowMap.size} rows`
  );
}

// --- Search ---

export interface SearchResult {
  type: string;
  entityId: string;
  title: string;
  body: string;
  projectId: string;
  score: number;
}

export async function searchIndex(query: string, limit = 20): Promise<SearchResult[]> {
  const instance = await getDb();
  const results = await search(instance, {
    term: query,
    limit,
    properties: ['title', 'body'],
  });

  return results.hits.map((hit) => ({
    type: hit.document.type as string,
    entityId: hit.document.entityId as string,
    title: hit.document.title as string,
    body: hit.document.body as string,
    projectId: hit.document.projectId as string,
    score: hit.score,
  }));
}

// --- Incremental updates ---

export async function indexDocument(id: string, title: string, content: unknown, projectId: string) {
  const instance = await getDb();
  await removeByEntityId(instance, id);
  const body = content ? tiptapToText(content) : '';
  await insert(instance, { type: 'document', entityId: id, title, body, projectId });
}

export async function indexProject(id: string, name: string) {
  const instance = await getDb();
  await removeByEntityId(instance, id);
  await insert(instance, { type: 'project', entityId: id, title: name, body: '', projectId: '' });
}

export async function indexDatabase(id: string, name: string, projectId: string, propertyNames: string[] = []) {
  const instance = await getDb();
  await removeByEntityId(instance, id);
  await insert(instance, { type: 'database', entityId: id, title: name, body: propertyNames.join(' '), projectId });
}

export async function removeFromIndex(entityId: string) {
  const instance = await getDb();
  await removeByEntityId(instance, entityId);
}

// Helper: remove all docs matching an entityId
async function removeByEntityId(instance: AnyOrama, entityId: string) {
  const existing = await search(instance, { term: entityId, properties: ['entityId'], limit: 10 });
  for (const hit of existing.hits) {
    if (hit.document.entityId === entityId) {
      await remove(instance, hit.id);
    }
  }
}
