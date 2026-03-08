import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  Database,
  FileText,
  Loader2,
  ArrowRight,
  Clock3,
  Layers3,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useDatabases, useCreateDatabase } from "@/hooks/use-databases";
import { useDocuments, useCreateDocument } from "@/hooks/use-documents";
import * as api from "@/lib/api";

type ActivityItem = {
  id: string;
  name: string;
  type: "project" | "database" | "document";
  updatedAt: string;
  path: string;
  projectName?: string;
};

type QuickCreateType = "project" | "database" | "document";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: databases, isLoading: loadingDatabases } = useDatabases();
  const { data: documents, isLoading: loadingDocuments } = useDocuments();

  const createProjectMutation = useCreateProject();
  const createDatabaseMutation = useCreateDatabase();
  const createDocumentMutation = useCreateDocument();

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickType, setQuickType] = useState<QuickCreateType>("project");
  const [quickName, setQuickName] = useState("");
  const [quickProjectId, setQuickProjectId] = useState("");

  const isLoading = loadingProjects || loadingDatabases || loadingDocuments;

  const safeProjects = projects ?? [];
  const safeDatabases = databases ?? [];
  const safeDocuments = documents ?? [];

  useEffect(() => {
    if (!quickProjectId && safeProjects.length > 0) {
      setQuickProjectId(safeProjects[0].id);
    }
  }, [quickProjectId, safeProjects]);

  const projectNameById = useMemo(
    () => new Map(safeProjects.map((project) => [project.id, project.name])),
    [safeProjects]
  );

  const missingProjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const database of safeDatabases) {
      if (!projectNameById.has(database.projectId)) ids.add(database.projectId);
    }
    for (const document of safeDocuments) {
      if (!projectNameById.has(document.projectId)) ids.add(document.projectId);
    }
    return [...ids].sort();
  }, [safeDatabases, safeDocuments, projectNameById]);

  const { data: missingProjects } = useQuery({
    queryKey: ["projects", "missing-names", missingProjectIds],
    enabled: missingProjectIds.length > 0,
    queryFn: async () => {
      const items = await Promise.all(
        missingProjectIds.map((id) => api.getProject(id))
      );
      return items.map((project) => ({ id: project.id, name: project.name }));
    },
  });

  const allProjectNameById = useMemo(() => {
    const map = new Map(projectNameById);
    for (const project of missingProjects ?? []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projectNameById, missingProjects]);

  const sortedProjects = useMemo(
    () =>
      [...safeProjects].sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
      ),
    [safeProjects]
  );
  const recentProjects = sortedProjects.slice(0, 6);

  const activity: ActivityItem[] = useMemo(
    () =>
      [
        ...safeProjects.map((project) => ({
          id: project.id,
          name: project.name,
          type: "project" as const,
          updatedAt: project.updatedAt,
          path: `/projects/${project.id}`,
        })),
        ...safeDatabases.map((database) => ({
          id: database.id,
          name: database.name,
          type: "database" as const,
          updatedAt: database.updatedAt,
          path: `/databases/${database.id}`,
          projectName: allProjectNameById.get(database.projectId),
        })),
        ...safeDocuments.map((document) => ({
          id: document.id,
          name: document.title,
          type: "document" as const,
          updatedAt: document.updatedAt,
          path: `/documents/${document.id}`,
          projectName: allProjectNameById.get(document.projectId),
        })),
      ]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 12),
    [safeProjects, safeDatabases, safeDocuments, allProjectNameById]
  );

  const activityTypeLabel: Record<ActivityItem["type"], string> = {
    project: "Proyecto",
    database: "Base de datos",
    document: "Documento",
  };

  const resetQuickForm = () => {
    setQuickName("");
    setQuickType("project");
    setQuickOpen(false);
  };

  const quickPending =
    createProjectMutation.isPending ||
    createDatabaseMutation.isPending ||
    createDocumentMutation.isPending;

  const onQuickSubmit = () => {
    const name = quickName.trim();
    if (!name) return;

    if (quickType === "project") {
      createProjectMutation.mutate(
        { name },
        {
          onSuccess: (project) => {
            resetQuickForm();
            navigate(`/projects/${project.id}`);
          },
        }
      );
      return;
    }

    if (!quickProjectId) return;

    if (quickType === "database") {
      createDatabaseMutation.mutate(
        { name, projectId: quickProjectId },
        {
          onSuccess: (database) => {
            resetQuickForm();
            navigate(`/databases/${database.id}`);
          },
        }
      );
      return;
    }

    createDocumentMutation.mutate(
      { title: name, projectId: quickProjectId },
      {
        onSuccess: (document) => {
          resetQuickForm();
          navigate(`/documents/${document.id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panel personal para decidir rapido que tocar ahora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setQuickOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nota rápida
          </Button>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Abrir Proyectos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Proyectos totales</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
              {safeProjects.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Bases de datos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Database className="h-6 w-6 text-muted-foreground" />
              {safeDatabases.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Documentos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              {safeDocuments.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            Continuar trabajando
          </CardTitle>
          <CardDescription>
            Ultimos elementos actualizados y acceso inmediato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin actividad aun. Crea tu primer proyecto para empezar.
            </p>
          ) : (
            activity.slice(0, 4).map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                onClick={() => navigate(item.path)}
              >
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {activityTypeLabel[item.type]} |{" "}
                  {new Date(item.updatedAt).toLocaleDateString("es", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {item.type !== "project" && (
                  <div className="text-xs text-muted-foreground/90 mt-1">
                    Proyecto: {item.projectName ?? "Proyecto desconocido"}
                  </div>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            Proyectos recientes
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Sin proyectos aun</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Ve a Proyectos para crear el primero.
            </p>
            <Button onClick={() => navigate("/projects")}>Ir a Proyectos</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    {project._count?.databases ?? 0}{" "}
                    {(project._count?.databases ?? 0) === 1
                      ? "base de datos"
                      : "bases de datos"}{" "}
                    | {project._count?.documents ?? 0}{" "}
                    {(project._count?.documents ?? 0) === 1
                      ? "documento"
                      : "documentos"}{" "}
                    | Actualizado{" "}
                    {new Date(project.updatedAt).toLocaleDateString("es", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={quickOpen}
        onOpenChange={(open) => {
          setQuickOpen(open);
          if (!open) {
            setQuickName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota rápida</DialogTitle>
            <DialogDescription>
              Crea un elemento en segundos y entra directo a editarlo.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onQuickSubmit();
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={quickType}
                onChange={(e) => setQuickType(e.target.value as QuickCreateType)}
              >
                <option value="project">Proyecto</option>
                <option value="database">Base de datos</option>
                <option value="document">Documento</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder={
                  quickType === "project"
                    ? "Nombre del proyecto"
                    : quickType === "database"
                      ? "Nombre de la base de datos"
                      : "Titulo del documento"
                }
                autoFocus
              />
            </div>

            {quickType !== "project" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Proyecto destino</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={quickProjectId}
                  onChange={(e) => setQuickProjectId(e.target.value)}
                >
                  {safeProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {safeProjects.length === 0 && (
                  <p className="text-xs text-destructive">
                    Crea primero un proyecto para poder crear documentos o bases de
                    datos.
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={quickPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  !quickName.trim() ||
                  quickPending ||
                  ((quickType === "database" || quickType === "document") &&
                    !quickProjectId)
                }
              >
                {quickPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear y abrir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
