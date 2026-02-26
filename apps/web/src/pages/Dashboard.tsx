import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Database,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";
import { useDatabases } from "@/hooks/use-databases";
import { useDocuments } from "@/hooks/use-documents";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: databases, isLoading: loadingDatabases } = useDatabases();
  const { data: documents, isLoading: loadingDocuments } = useDocuments();

  const isLoading = loadingProjects || loadingDatabases || loadingDocuments;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recentProjects = projects?.slice(0, 6) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
              {projects?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Databases</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Database className="h-6 w-6 text-muted-foreground" />
              {databases?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              {documents?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
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
            <Button onClick={() => navigate("/projects")}>
              Go to Projects
            </Button>
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
                    {project._count?.databases === 1 ? "" : "s"} &middot;
                    Updated{" "}
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
