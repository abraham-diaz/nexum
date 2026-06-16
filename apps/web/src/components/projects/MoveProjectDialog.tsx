import { useEffect, useState } from "react";
import { ChevronRight, FolderInput, FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProjectChildren, useMoveProject } from "@/hooks/use-projects";
import type { Project } from "@/lib/api";

interface MovableProject {
  id: string;
  name: string;
  parentId: string | null;
}

interface Crumb {
  id: string | null;
  name: string;
}

const ROOT_CRUMB: Crumb = { id: null, name: "Raíz" };

export default function MoveProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: MovableProject | null;
}) {
  const [breadcrumb, setBreadcrumb] = useState<Crumb[]>([ROOT_CRUMB]);
  const moveMutation = useMoveProject();

  const folder = breadcrumb[breadcrumb.length - 1];
  const { data: children, isLoading } = useProjectChildren(folder.id);

  useEffect(() => {
    if (open) {
      setBreadcrumb([ROOT_CRUMB]);
      moveMutation.reset();
    }
  }, [open, project?.id]);

  if (!project) return null;

  const isCurrentLocation = folder.id === (project.parentId ?? null);

  const navigateInto = (target: Project) => {
    if (target.id === project.id) return;
    setBreadcrumb((prev) => [...prev, { id: target.id, name: target.name }]);
  };

  const goToCrumb = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  const handleMoveHere = () => {
    moveMutation.mutate(
      { id: project.id, parentId: folder.id },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover "{project.name}"</DialogTitle>
          <DialogDescription>
            Navega hasta la carpeta donde quieres mover este proyecto.
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap text-sm">
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id ?? "root"} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <button
                onClick={() => goToCrumb(index)}
                disabled={index === breadcrumb.length - 1}
                className={
                  index === breadcrumb.length - 1
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Folder list */}
        <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : children && children.length > 0 ? (
            children.map((child) => {
              const isSelf = child.id === project.id;
              return (
                <button
                  key={child.id}
                  disabled={isSelf}
                  onClick={() => navigateInto(child)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{child.name}</span>
                  {isSelf && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      (este proyecto)
                    </span>
                  )}
                  {!isSelf && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No hay subcarpetas aquí.
            </p>
          )}
        </div>

        {moveMutation.isError && (
          <p className="text-sm text-destructive">
            {moveMutation.error instanceof Error
              ? moveMutation.error.message
              : "No se pudo mover el proyecto."}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleMoveHere}
            disabled={isCurrentLocation || moveMutation.isPending}
          >
            {moveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderInput className="mr-2 h-4 w-4" />
            )}
            Mover a "{folder.name}"
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
