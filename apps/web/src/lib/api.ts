const API_BASE = "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
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
  _count?: { databases: number; children: number };
}

export interface ProjectDetail extends Omit<Project, "_count"> {
  children: Project[];
  databases: Database[];
  parent: { id: string; name: string; parentId: string | null } | null;
}

export interface Database {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "RELATION";
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

export function createDatabase(name: string, projectId: string) {
  return request<Database>("/databases", {
    method: "POST",
    body: JSON.stringify({ name, projectId }),
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

export function createRow(databaseId: string) {
  return request<Row>(`/databases/${databaseId}/rows`, { method: "POST" });
}

export function deleteRow(databaseId: string, id: string) {
  return request<void>(`/databases/${databaseId}/rows/${id}`, {
    method: "DELETE",
  });
}

export function upsertCell(rowId: string, propertyId: string, value: unknown) {
  return request<Cell>(`/rows/${rowId}/cells/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}
