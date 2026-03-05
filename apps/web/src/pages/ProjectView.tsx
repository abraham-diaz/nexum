import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Database,
  FolderKanban,
  FileText,
  Loader2,
  ArrowLeft,
  KanbanSquare,
  Table2,
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
  useTemplates,
} from "@/hooks/use-databases";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks/use-documents";
import type {
  Project,
  Database as DatabaseType,
  Document,
  DatabaseTemplate,
} from "@/lib/api";

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
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
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
          <DialogTitle>Eliminar {label}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  kanban: <KanbanSquare className="h-8 w-8" />,
};

function CreateDatabaseDialog({
  open,
  onOpenChange,
  templates,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: DatabaseTemplate[];
  onSubmit: (name: string, templateId?: string) => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState<"template" | "name">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    undefined
  );
  const [name, setName] = useState("");

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setStep("template");
      setSelectedTemplate(undefined);
      setName("");
    }
  };

  const selectTemplate = (templateId?: string) => {
    setSelectedTemplate(templateId);
    setStep("name");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "template" ? (
          <>
            <DialogHeader>
              <DialogTitle>Crear base de datos</DialogTitle>
              <DialogDescription>
                Elige una plantilla o empieza desde cero.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => selectTemplate(undefined)}
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50"
              >
                <Table2 className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">En blanco</span>
                <span className="text-xs text-muted-foreground">
                  Empieza con una tabla vacía
                </span>
              </button>
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => selectTemplate(tpl.id)}
                  className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50"
                >
                  {TEMPLATE_ICONS[tpl.icon] ?? (
                    <Database className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{tpl.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nombre de la base de datos</DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? `Creando desde la plantilla "${templates.find((t) => t.id === selectedTemplate)?.name}".`
                  : "Empezando con una base de datos en blanco."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) onSubmit(name.trim(), selectedTemplate);
              }}
            >
              <Input
                placeholder="Nombre de la base de datos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("template");
                    setName("");
                  }}
                >
                  Atrás
                </Button>
                <Button type="submit" disabled={!name.trim() || isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id!);

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const createDbMutation = useCreateDatabase();
  const updateDbMutation = useUpdateDatabase();
  const deleteDbMutation = useDeleteDatabase();
  const { data: templates = [] } = useTemplates();

  const createDocMutation = useCreateDocument();
  const updateDocMutation = useUpdateDocument();
  const deleteDocMutation = useDeleteDocument();

  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [editSubTarget, setEditSubTarget] = useState<Project | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<Project | null>(null);

  const [createDbOpen, setCreateDbOpen] = useState(false);
  const [editDbTarget, setEditDbTarget] = useState<DatabaseType | null>(null);
  const [deleteDbTarget, setDeleteDbTarget] = useState<DatabaseType | null>(null);

  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [editDocTarget, setEditDocTarget] = useState<Document | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<Document | null>(null);

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
          Error al cargar el proyecto. Asegúrate de que el servidor API esté en ejecución.
        </p>
      </div>
    );
  }

  const children = project.children ?? [];
  const databases = project.databases ?? [];
  const documents = project.documents ?? [];
  const hasChildren = children.length > 0;
  const hasDatabases = databases.length > 0;
  const hasDocuments = documents.length > 0;
  const isEmpty = !hasChildren && !hasDatabases && !hasDocuments;

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
              Subproyecto
            </Button>
          )}
          <Button onClick={() => setCreateDbOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Base de datos
          </Button>
          <Button variant="outline" onClick={() => setCreateDocOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Documento
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Este proyecto está vacío</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {canCreateSub
              ? "Añade subproyectos para organizar, o crea bases de datos directamente."
              : "Crea tu primera base de datos en esta sección."}
          </p>
          <div className="flex gap-2">
            {canCreateSub && (
              <Button variant="outline" onClick={() => setCreateSubOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Subproyecto
              </Button>
            )}
            <Button onClick={() => setCreateDbOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Base de datos
            </Button>
            <Button variant="outline" onClick={() => setCreateDocOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Documento
            </Button>
          </div>
        </div>
      )}

      {/* Sub-projects */}
      {hasChildren && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Subproyectos
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
                      ? `${child._count.children} ${child._count.children === 1 ? "subproyecto" : "subproyectos"}`
                      : ""}
                    {child._count?.children && child._count?.databases
                      ? " · "
                      : ""}
                    {child._count?.databases
                      ? `${child._count.databases} ${child._count.databases === 1 ? "base de datos" : "bases de datos"}`
                      : ""}
                    {!child._count?.children && !child._count?.databases
                      ? "Vacío"
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
            Bases de datos
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
                    Creado el{" "}
                    {new Date(db.createdAt).toLocaleDateString("es", {
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

      {/* Documents */}
      {hasDocuments && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Documentos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="group cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.title}
                  </CardTitle>
                  <CardDescription>
                    Creado el{" "}
                    {new Date(doc.createdAt).toLocaleDateString("es", {
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
                        onClick={() => setEditDocTarget(doc)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDocTarget(doc)}
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
        title="Crear subproyecto"
        description="Dale un nombre a tu nuevo subproyecto."
        placeholder="Nombre del subproyecto"
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
        title="Renombrar subproyecto"
        description="Introduce un nuevo nombre para este subproyecto."
        placeholder="Nombre del subproyecto"
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
        label="subproyecto"
        message={`¿Estás seguro de que quieres eliminar "${deleteSubTarget?.name}"? Todo el contenido incluido también se eliminará. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (!deleteSubTarget) return;
          deleteProjectMutation.mutate(deleteSubTarget.id, {
            onSuccess: () => setDeleteSubTarget(null),
          });
        }}
        isPending={deleteProjectMutation.isPending}
      />

      {/* --- Dialogs: Databases --- */}
      <CreateDatabaseDialog
        open={createDbOpen}
        onOpenChange={(open) => {
          setCreateDbOpen(open);
          if (!open) createDbMutation.reset();
        }}
        templates={templates}
        onSubmit={(name, templateId) => {
          createDbMutation.mutate(
            { name, projectId: id!, templateId },
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
        title="Renombrar base de datos"
        description="Introduce un nuevo nombre para esta base de datos."
        placeholder="Nombre de la base de datos"
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
        label="base de datos"
        message={`¿Estás seguro de que quieres eliminar "${deleteDbTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (!deleteDbTarget) return;
          deleteDbMutation.mutate(deleteDbTarget.id, {
            onSuccess: () => setDeleteDbTarget(null),
          });
        }}
        isPending={deleteDbMutation.isPending}
      />

      {/* --- Dialogs: Documents --- */}
      <NameFormDialog
        open={createDocOpen}
        onOpenChange={(open) => {
          setCreateDocOpen(open);
          if (!open) createDocMutation.reset();
        }}
        title="Crear documento"
        description="Dale un título a tu nuevo documento."
        placeholder="Título del documento"
        onSubmit={(name) => {
          createDocMutation.mutate(
            { title: name, projectId: id! },
            { onSuccess: () => setCreateDocOpen(false) }
          );
        }}
        isPending={createDocMutation.isPending}
      />

      <NameFormDialog
        key={`edit-doc-${editDocTarget?.id}`}
        open={!!editDocTarget}
        onOpenChange={(open) => {
          if (!open) setEditDocTarget(null);
        }}
        title="Renombrar documento"
        description="Introduce un nuevo título para este documento."
        placeholder="Título del documento"
        initialName={editDocTarget?.title}
        onSubmit={(name) => {
          if (!editDocTarget) return;
          updateDocMutation.mutate(
            { id: editDocTarget.id, data: { title: name } },
            { onSuccess: () => setEditDocTarget(null) }
          );
        }}
        isPending={updateDocMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteDocTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteDocTarget(null);
        }}
        label="documento"
        message={`¿Estás seguro de que quieres eliminar "${deleteDocTarget?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (!deleteDocTarget) return;
          deleteDocMutation.mutate(deleteDocTarget.id, {
            onSuccess: () => setDeleteDocTarget(null),
          });
        }}
        isPending={deleteDocMutation.isPending}
      />
    </div>
  );
}
