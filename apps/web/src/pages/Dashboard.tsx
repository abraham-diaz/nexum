import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Database, Loader2 } from "lucide-react";
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
  useDatabases,
  useCreateDatabase,
  useUpdateDatabase,
  useDeleteDatabase,
} from "@/hooks/use-databases";
import type { Database as DatabaseType } from "@/lib/api";

function DatabaseFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = "",
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
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
            placeholder="Database name"
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

function DeleteDialog({
  open,
  onOpenChange,
  database,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseType | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete database</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong>{database?.name}</strong>? This action cannot be undone.
          </DialogDescription>
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: databases, isLoading, error } = useDatabases();

  const createMutation = useCreateDatabase();
  const updateMutation = useUpdateDatabase();
  const deleteMutation = useDeleteDatabase();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DatabaseType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatabaseType | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">
          Failed to load databases. Make sure the API server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Databases</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Database
        </Button>
      </div>

      {databases?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No databases yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first database to get started.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Database
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {databases?.map((db) => (
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
                      onClick={() => setEditTarget(db)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(db)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <DatabaseFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createMutation.reset();
        }}
        title="Create database"
        description="Give your new database a name."
        onSubmit={(name) => {
          createMutation.mutate(name, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        isPending={createMutation.isPending}
      />

      {/* Edit dialog */}
      <DatabaseFormDialog
        key={editTarget?.id}
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title="Rename database"
        description="Enter a new name for this database."
        initialName={editTarget?.name}
        onSubmit={(name) => {
          if (!editTarget) return;
          updateMutation.mutate(
            { id: editTarget.id, name },
            { onSuccess: () => setEditTarget(null) }
          );
        }}
        isPending={updateMutation.isPending}
      />

      {/* Delete dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        database={deleteTarget}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
