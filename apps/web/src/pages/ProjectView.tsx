import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Database,
  FolderKanban,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
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
import {
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import {
  useCreateDatabase,
  useUpdateDatabase,
  useDeleteDatabase,
} from "@/hooks/use-databases";
import type { Project, Database as DatabaseType } from "@/lib/api";

function NameFormDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  initialName = "",
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  initialName?: string;
  onSubmit: (name: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initialName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit(name.trim());
          }}
        >
          <Input
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  label,
  message,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  message: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {label}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id!);

  // Sub-project mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Database mutations
  const createDbMutation = useCreateDatabase();
  const updateDbMutation = useUpdateDatabase();
  const deleteDbMutation = useDeleteDatabase();

  // Sub-project dialog state
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [editSubTarget, setEditSubTarget] = useState<Project | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<Project | null>(null);

  // Database dialog state
  const [createDbOpen, setCreateDbOpen] = useState(false);
  const [editDbTarget, setEditDbTarget] = useState<DatabaseType | null>(null);
  const [deleteDbTarget, setDeleteDbTarget] = useState<DatabaseType | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">
          Failed to load project. Make sure the API server is running.
        </p>
      </div>
    );
  }

  const children = project.children ?? [];
  const databases = project.databases ?? [];
  const hasChildren = children.length > 0;
  const hasDatabases = databases.length > 0;
  const isEmpty = !hasChildren && !hasDatabases;

  // Nivel 1: sin padre, Nivel 2: padre sin abuelo, Nivel 3: padre con abuelo
  const isMaxDepth = !!project.parent?.parentId;
  const canCreateSub = !isMaxDepth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex gap-2">
          {canCreateSub && (
            <Button variant="outline" onClick={() => setCreateSubOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Sub-project
            </Button>
          )}
          <Button onClick={() => setCreateDbOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Database
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">This project is empty</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {canCreateSub
              ? "Add sub-projects to organize by client, or create databases directly."
              : "Create your first database in this section."}
          </p>
          <div className="flex gap-2">
            {canCreateSub && (
              <Button variant="outline" onClick={() => setCreateSubOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Sub-project
              </Button>
            )}
            <Button onClick={() => setCreateDbOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Database
            </Button>
          </div>
        </div>
      )}

      {/* Sub-projects */}
      {hasChildren && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Sub-projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Card
                key={child.id}
                className="group cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => navigate(`/projects/${child.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    {child.name}
                  </CardTitle>
                  <CardDescription>
                    {child._count?.children
                      ? `${child._count.children} sub-project${child._count.children === 1 ? "" : "s"}`
                      : ""}
                    {child._count?.children && child._count?.databases
                      ? " · "
                      : ""}
                    {child._count?.databases
                      ? `${child._count.databases} database${child._count.databases === 1 ? "" : "s"}`
                      : ""}
                    {!child._count?.children && !child._count?.databases
                      ? "Empty"
                      : ""}
                  </CardDescription>
                  <CardAction>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditSubTarget(child)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSubTarget(child)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Databases */}
      {hasDatabases && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Databases
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {databases.map((db) => (
              <Card
                key={db.id}
                className="group cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => navigate(`/databases/${db.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    {db.name}
                  </CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(db.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardDescription>
                  <CardAction>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditDbTarget(db)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDbTarget(db)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- Dialogs: Sub-projects --- */}
      <NameFormDialog
        open={createSubOpen}
        onOpenChange={(open) => {
          setCreateSubOpen(open);
          if (!open) createProjectMutation.reset();
        }}
        title="Create sub-project"
        description="Give your new sub-project a name."
        placeholder="Sub-project name"
        onSubmit={(name) => {
          createProjectMutation.mutate(
            { name, parentId: id },
            { onSuccess: () => setCreateSubOpen(false) }
          );
        }}
        isPending={createProjectMutation.isPending}
      />

      <NameFormDialog
        key={`edit-sub-${editSubTarget?.id}`}
        open={!!editSubTarget}
        onOpenChange={(open) => {
          if (!open) setEditSubTarget(null);
        }}
        title="Rename sub-project"
        description="Enter a new name for this sub-project."
        placeholder="Sub-project name"
        initialName={editSubTarget?.name}
        onSubmit={(name) => {
          if (!editSubTarget) return;
          updateProjectMutation.mutate(
            { id: editSubTarget.id, name },
            { onSuccess: () => setEditSubTarget(null) }
          );
        }}
        isPending={updateProjectMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteSubTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteSubTarget(null);
        }}
        label="sub-project"
        message={`Are you sure you want to delete "${deleteSubTarget?.name}"? All content inside will also be deleted. This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteSubTarget) return;
          deleteProjectMutation.mutate(deleteSubTarget.id, {
            onSuccess: () => setDeleteSubTarget(null),
          });
        }}
        isPending={deleteProjectMutation.isPending}
      />

      {/* --- Dialogs: Databases --- */}
      <NameFormDialog
        open={createDbOpen}
        onOpenChange={(open) => {
          setCreateDbOpen(open);
          if (!open) createDbMutation.reset();
        }}
        title="Create database"
        description="Give your new database a name."
        placeholder="Database name"
        onSubmit={(name) => {
          createDbMutation.mutate(
            { name, projectId: id! },
            { onSuccess: () => setCreateDbOpen(false) }
          );
        }}
        isPending={createDbMutation.isPending}
      />

      <NameFormDialog
        key={`edit-db-${editDbTarget?.id}`}
        open={!!editDbTarget}
        onOpenChange={(open) => {
          if (!open) setEditDbTarget(null);
        }}
        title="Rename database"
        description="Enter a new name for this database."
        placeholder="Database name"
        initialName={editDbTarget?.name}
        onSubmit={(name) => {
          if (!editDbTarget) return;
          updateDbMutation.mutate(
            { id: editDbTarget.id, name },
            { onSuccess: () => setEditDbTarget(null) }
          );
        }}
        isPending={updateDbMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteDbTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteDbTarget(null);
        }}
        label="database"
        message={`Are you sure you want to delete "${deleteDbTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteDbTarget) return;
          deleteDbMutation.mutate(deleteDbTarget.id, {
            onSuccess: () => setDeleteDbTarget(null),
          });
        }}
        isPending={deleteDbMutation.isPending}
      />
    </div>
  );
}
