const API_BASE = "/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// --- Auth API ---

export async function loginApi(user: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Login failed");
  }

  return res.json() as Promise<{ accessToken: string }>;
}

export async function refreshApi() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Refresh failed");

  return res.json() as Promise<{ accessToken: string }>;
}

export async function logoutApi() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// --- Generic request with auth ---

let isRefreshing: Promise<void> | null = null;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
      credentials: "include",
    });

  let res = await doFetch();

  // If 401, try refreshing the token once
  if (res.status === 401 && accessToken) {
    if (!isRefreshing) {
      isRefreshing = refreshApi()
        .then((data) => {
          accessToken = data.accessToken;
        })
        .catch(() => {
          accessToken = null;
          window.location.href = "/login";
        })
        .finally(() => {
          isRefreshing = null;
        });
    }

    await isRefreshing;

    if (accessToken) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      accessToken = null;
      window.location.href = "/login";
    }
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { databases: number; children: number; documents: number };
}

export interface ProjectDetail extends Omit<Project, "_count"> {
  children: Project[];
  databases: Database[];
  documents: Document[];
  parent: { id: string; name: string; parentId: string | null } | null;
}

export interface Database {
  id: string;
  name: string;
  viewType: "TABLE" | "BOARD";
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultViewType: "TABLE" | "BOARD";
  properties: {
    name: string;
    type: Property["type"];
    order: number;
    config?: unknown;
  }[];
}

export interface Property {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "DATE" | "RELATION";
  order: number;
  config: unknown;
  databaseId: string;
  relationDatabaseId?: string | null;
  createdAt: string;
}

export interface Cell {
  id: string;
  value: unknown;
  rowId: string;
  propertyId: string;
  property: Property;
}

export interface Row {
  id: string;
  order: number;
  databaseId: string;
  cells: Cell[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: unknown;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseDetail extends Database {
  properties: Property[];
  _count: { rows: number };
}

// --- Projects ---

export function getProjects(parentId?: string) {
  const query = parentId ? `?parentId=${parentId}` : "";
  return request<Project[]>(`/projects${query}`);
}

export function getProject(id: string) {
  return request<ProjectDetail>(`/projects/${id}`);
}

export function createProject(name: string, parentId?: string) {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ name, parentId }),
  });
}

export function updateProject(id: string, name: string) {
  return request<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteProject(id: string) {
  return request<void>(`/projects/${id}`, { method: "DELETE" });
}

// --- Databases ---

export function getDatabases() {
  return request<Database[]>("/databases");
}

export function getTemplates() {
  return request<DatabaseTemplate[]>("/databases/templates");
}

export function createDatabase(
  name: string,
  projectId: string,
  templateId?: string
) {
  return request<Database>("/databases", {
    method: "POST",
    body: JSON.stringify({ name, projectId, templateId }),
  });
}

export function updateDatabaseViewType(
  id: string,
  viewType: "TABLE" | "BOARD"
) {
  return request<Database>(`/databases/${id}/view-type`, {
    method: "PATCH",
    body: JSON.stringify({ viewType }),
  });
}

export function updateDatabase(id: string, name: string) {
  return request<Database>(`/databases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteDatabase(id: string) {
  return request<void>(`/databases/${id}`, { method: "DELETE" });
}

export function getDatabase(id: string) {
  return request<DatabaseDetail>(`/databases/${id}`);
}

export function getRows(databaseId: string) {
  return request<Row[]>(`/databases/${databaseId}/rows`);
}

export function createProperty(
  databaseId: string,
  data: { name: string; type: Property["type"] }
) {
  return request<Property>(`/databases/${databaseId}/properties`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteProperty(databaseId: string, id: string) {
  return request<void>(`/databases/${databaseId}/properties/${id}`, {
    method: "DELETE",
  });
}

export function createRow(
  databaseId: string,
  cells?: { propertyId: string; value: unknown }[]
) {
  return request<Row>(`/databases/${databaseId}/rows`, {
    method: "POST",
    body: JSON.stringify({ cells }),
  });
}

export function deleteRow(databaseId: string, id: string) {
  return request<void>(`/databases/${databaseId}/rows/${id}`, {
    method: "DELETE",
  });
}

export function reorderRows(databaseId: string, orderedIds: string[]) {
  return request<{ ok: boolean }>(`/databases/${databaseId}/rows/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
}

export function upsertCell(rowId: string, propertyId: string, value: unknown) {
  return request<Cell>(`/rows/${rowId}/cells/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

// --- Documents ---

export function getDocuments() {
  return request<Document[]>("/documents");
}

export function getDocument(id: string) {
  return request<Document>(`/documents/${id}`);
}

export function createDocument(title: string, projectId: string) {
  return request<Document>("/documents", {
    method: "POST",
    body: JSON.stringify({ title, projectId }),
  });
}

export function updateDocument(
  id: string,
  data: { title?: string; content?: unknown }
) {
  return request<Document>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteDocument(id: string) {
  return request<void>(`/documents/${id}`, { method: "DELETE" });
}

// --- Search ---

export interface SearchResults {
  projects: Project[];
  databases: Database[];
  documents: Document[];
}

export function searchAll(query: string) {
  return request<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
}
