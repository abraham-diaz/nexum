import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  Database,
  FileText,
  Loader2,
  ArrowRight,
  Clock3,
  Sparkles,
  Layers3,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";
import { useDatabases } from "@/hooks/use-databases";
import { useDocuments } from "@/hooks/use-documents";
import * as api from "@/lib/api";

type ActivityItem = {
  id: string;
  name: string;
  type: "project" | "database" | "document";
  updatedAt: string;
  path: string;
  projectName?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: databases, isLoading: loadingDatabases } = useDatabases();
  const { data: documents, isLoading: loadingDocuments } = useDocuments();

  const isLoading = loadingProjects || loadingDatabases || loadingDocuments;

  const safeProjects = projects ?? [];
  const safeDatabases = databases ?? [];
  const safeDocuments = documents ?? [];
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
      const projects = await Promise.all(
        missingProjectIds.map((id) => api.getProject(id))
      );
      return projects.map((project) => ({ id: project.id, name: project.name }));
    },
  });

  const allProjectNameById = useMemo(() => {
    const map = new Map(projectNameById);
    for (const project of missingProjects ?? []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projectNameById, missingProjects]);

  const sortedProjects = [...safeProjects].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
  );
  const recentProjects = sortedProjects.slice(0, 6);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyActive =
    safeDatabases.filter((d) => +new Date(d.updatedAt) >= sevenDaysAgo).length +
    safeDocuments.filter((d) => +new Date(d.updatedAt) >= sevenDaysAgo).length;

  const activity: ActivityItem[] = [
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
    .slice(0, 8);

  const emptyProjects = sortedProjects.filter((project) => {
    const dbCount = project._count?.databases ?? 0;
    const docCount = project._count?.documents ?? 0;
    return dbCount + docCount === 0;
  });

  const topProjects = sortedProjects
    .map((project) => ({
      ...project,
      totalItems:
        (project._count?.databases ?? 0) + (project._count?.documents ?? 0),
    }))
    .sort((a, b) => b.totalItems - a.totalItems)
    .slice(0, 3);

  const activityTypeLabel: Record<ActivityItem["type"], string> = {
    project: "Project",
    database: "Database",
    document: "Document",
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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quick view of what is active and where to continue.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          Open Projects
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
              {safeProjects.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Databases</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Database className="h-6 w-6 text-muted-foreground" />
              {safeDatabases.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              {safeDocuments.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active This Week</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
              {weeklyActive}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              Continue Working
            </CardTitle>
            <CardDescription>Most recently updated items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Create your first project to begin.
              </p>
            ) : (
              activity.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {activityTypeLabel[item.type]} |{" "}
                    {new Date(item.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {item.type !== "project" && (
                    <div className="text-xs text-muted-foreground/90 mt-1">
                      Project: {item.projectName ?? "Unknown project"}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Focus
            </CardTitle>
            <CardDescription>Projects that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Empty projects
              </p>
              {emptyProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Great, none empty.</p>
              ) : (
                <div className="space-y-2">
                  {emptyProjects.slice(0, 3).map((project) => (
                    <button
                      key={project.id}
                      className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="text-sm font-medium truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        No databases or documents
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Most populated
              </p>
              {topProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProjects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="text-sm font-medium truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {project._count?.databases ?? 0} DBs |{" "}
                        {project._count?.documents ?? 0} docs
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            Recent Projects
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Head over to Projects to create your first one.
            </p>
            <Button onClick={() => navigate("/projects")}>Go to Projects</Button>
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
                    {project._count?.databases ?? 0} database
                    {project._count?.databases === 1 ? "" : "s"} |{" "}
                    {project._count?.documents ?? 0} document
                    {(project._count?.documents ?? 0) === 1 ? "" : "s"} | Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString(undefined, {
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
    </div>
  );
}
