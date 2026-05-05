import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Columns3,
  TableProperties,
  KanbanSquare,
  GripVertical,
  Settings2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDatabase,
  useRows,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useCreateRow,
  useDeleteRow,
  useUpsertCell,
  useReorderRows,
} from "@/hooks/use-database";
import { useUpdateViewType, useUpdateDatabase, useDatabases } from "@/hooks/use-databases";
import KanbanBoard from "@/components/database/KanbanBoard";
import { useRecentItems } from "@/hooks/use-recent";
import type { Property, Row } from "@/lib/api";

const SelectCell = memo(function SelectCell({
  value,
  options,
  onSave,
}: {
  value: unknown;
  options: string[];
  onSave: (value: string | null) => void;
}) {
  const current = String(value ?? "");

  const palette = [
    "bg-blue-500/15 text-blue-400",
    "bg-green-500/15 text-green-400",
    "bg-yellow-500/15 text-yellow-400",
    "bg-red-500/15 text-red-400",
    "bg-purple-500/15 text-purple-400",
    "bg-pink-500/15 text-pink-400",
    "bg-cyan-500/15 text-cyan-400",
    "bg-orange-500/15 text-orange-400",
  ];
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    options.forEach((opt, i) => {
      map[opt] = palette[i % palette.length];
    });
    return map;
  }, [options]);

  return (
    <div className="min-h-8 px-1 py-1">
      <select
        className="h-7 w-full rounded border-none bg-background text-foreground text-sm focus:ring-1 focus:ring-ring outline-none px-1"
        value={current}
        onChange={(e) => onSave(e.target.value || null)}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {current && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${colorMap[current] ?? palette[0]}`}
        >
          {current}
        </span>
      )}
    </div>
  );
});

const DateCell = memo(function DateCell({
  value,
  onSave,
}: {
  value: unknown;
  onSave: (value: string | null) => void;
}) {
  const current = String(value ?? "");

  return (
    <div className="min-h-8 px-1 py-1">
      <input
        type="date"
        className="h-7 w-full rounded border-none bg-transparent text-sm focus:ring-1 focus:ring-ring outline-none px-1"
        value={current}
        onChange={(e) => onSave(e.target.value || null)}
      />
    </div>
  );
});

const EditableCell = memo(function EditableCell({
  value,
  onSave,
}: {
  value: unknown;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== String(value ?? "")) {
      onSave(trimmed);
    }
  };

  if (!editing) {
    return (
      <div
        className="min-h-8 px-2 py-1 cursor-text rounded hover:bg-muted/50"
        onClick={() => {
          setDraft(String(value ?? ""));
          setEditing(true);
        }}
      >
        {value != null && String(value) !== "" ? (
          String(value)
        ) : (
          <span className="text-muted-foreground/40 select-none">—</span>
        )}
      </div>
    );
  }

  return (
    <Input
      className="h-8 border-none shadow-none focus-visible:ring-1 rounded-sm"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      autoFocus
    />
  );
});

const RelationCell = memo(function RelationCell({
  value,
  relationDatabaseId,
  onSave,
}: {
  value: unknown;
  relationDatabaseId: string;
  onSave: (value: string | null) => void;
}) {
  const { data: relatedRows } = useRows(relationDatabaseId);

  const getRowLabel = (row: Row): string => {
    const firstTextCell = row.cells.find((c) => c.property.type === "TEXT");
    return firstTextCell?.value ? String(firstTextCell.value) : `Fila #${row.order + 1}`;
  };

  const current = value ? String(value) : "";
  const selectedRow = relatedRows?.find((r) => r.id === current);
  const sortedRows = useMemo(
    () => [...(relatedRows ?? [])].sort((a, b) => a.order - b.order),
    [relatedRows]
  );

  return (
    <div className="min-h-8 px-1 py-1">
      <select
        className="h-7 w-full rounded border-none bg-background text-foreground text-sm focus:ring-1 focus:ring-ring outline-none px-1"
        value={current}
        onChange={(e) => onSave(e.target.value || null)}
      >
        <option value="">—</option>
        {sortedRows.map((row) => (
          <option key={row.id} value={row.id}>
            {getRowLabel(row)}
          </option>
        ))}
      </select>
      {selectedRow && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 bg-violet-500/15 text-violet-400">
          {getRowLabel(selectedRow)}
        </span>
      )}
    </div>
  );
});

const PROPERTY_TYPES = ["TEXT", "NUMBER", "SELECT", "DATE", "RELATION"] as const;
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  TEXT: "Texto",
  NUMBER: "Número",
  SELECT: "Selección",
  DATE: "Fecha",
  RELATION: "Relación",
};

const SortableRow = memo(function SortableRow({
  row,
  idx,
  properties,
  onDelete,
  onUpsertCell,
}: {
  row: Row;
  idx: number;
  properties: Property[];
  onDelete: (id: string) => void;
  onUpsertCell: (rowId: string, propertyId: string, value: unknown) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };
  const cellByPropertyId = useMemo(
    () => new Map(row.cells.map((c) => [c.propertyId, c.value] as const)),
    [row.cells]
  );

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="text-muted-foreground text-xs">
        <div className="flex items-center gap-1">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span>{idx + 1}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={() => onDelete(row.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      {properties.map((prop) => (
        <TableCell key={prop.id} className="p-0">
          {prop.type === "SELECT" &&
          prop.config &&
          (prop.config as { options?: string[] }).options ? (
            <SelectCell
              value={cellByPropertyId.get(prop.id) ?? null}
              options={(prop.config as { options: string[] }).options}
              onSave={(value) => onUpsertCell(row.id, prop.id, value)}
            />
          ) : prop.type === "DATE" ? (
            <DateCell
              value={cellByPropertyId.get(prop.id) ?? null}
              onSave={(value) => onUpsertCell(row.id, prop.id, value)}
            />
          ) : prop.type === "RELATION" && prop.relationDatabaseId ? (
            <RelationCell
              value={cellByPropertyId.get(prop.id) ?? null}
              relationDatabaseId={prop.relationDatabaseId}
              onSave={(value) => onUpsertCell(row.id, prop.id, value)}
            />
          ) : (
            <EditableCell
              value={cellByPropertyId.get(prop.id) ?? null}
              onSave={(value) => onUpsertCell(row.id, prop.id, value)}
            />
          )}
        </TableCell>
      ))}
      <TableCell />
    </TableRow>
  );
});

const SortableColumnHead = memo(function SortableColumnHead({
  prop,
  onEditOptions,
  onDelete,
}: {
  prop: Property;
  onEditOptions: (prop: Property) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: prop.id });

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="min-w-37.5 group/head"
    >
      <div className="flex items-center gap-1">
        <button
          className="cursor-grab opacity-0 group-hover/head:opacity-100 shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <span className="truncate flex-1 text-sm font-medium">{prop.name}</span>
        <span className="text-[10px] text-muted-foreground font-normal uppercase shrink-0">
          {PROPERTY_TYPE_LABELS[prop.type] ?? prop.type}
        </span>
        {prop.type === "SELECT" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover/head:opacity-100 shrink-0"
            onClick={() => onEditOptions(prop)}
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover/head:opacity-100 shrink-0"
          onClick={() => onDelete(prop.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </TableHead>
  );
});

export default function DatabaseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: database,
    isLoading: dbLoading,
    error: dbError,
  } = useDatabase(id!);
  const { data: rows, isLoading: rowsLoading } = useRows(id!);

  const createProperty = useCreateProperty(id!);
  const updateProperty = useUpdateProperty(id!);
  const deleteProperty = useDeleteProperty(id!);
  const createRow = useCreateRow(id!);
  const deleteRow = useDeleteRow(id!);
  const upsertCell = useUpsertCell(id!);
  const reorderRows = useReorderRows(id!);
  const updateViewType = useUpdateViewType();
  const updateDatabase = useUpdateDatabase();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const { addItem: addRecent } = useRecentItems();

  useEffect(() => {
    if (database) {
      addRecent({
        id: database.id,
        type: "database",
        name: database.name,
        path: `/databases/${database.id}`,
      });
    }
  }, [database?.id, database?.name]);

  const { data: allDatabases } = useDatabases();

  const [addColOpen, setAddColOpen] = useState(false);
  const [colName, setColName] = useState("");
  const [colType, setColType] = useState<Property["type"]>("TEXT");
  const [colRelationDatabaseId, setColRelationDatabaseId] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const sortedRows = useMemo(
    () => [...(rows ?? [])].sort((a, b) => a.order - b.order),
    [rows]
  );
  const sortedRowIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows]);

  const sortedProperties = useMemo(
    () => [...(database?.properties ?? [])].sort((a, b) => a.order - b.order),
    [database?.properties]
  );
  const sortedPropertyIds = useMemo(
    () => sortedProperties.map((p) => p.id),
    [sortedProperties]
  );

  const handleDeleteRow = useCallback(
    (rowId: string) => deleteRow.mutate(rowId),
    [deleteRow]
  );
  const handleUpsertCell = useCallback(
    (rowId: string, propertyId: string, value: unknown) =>
      upsertCell.mutate({ rowId, propertyId, value }),
    [upsertCell]
  );

  const isLoading = dbLoading || rowsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dbError || !database) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">
          {dbError?.message ?? "Base de datos no encontrada."}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const properties = database.properties ?? [];
  const viewType = database.viewType ?? "TABLE";

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedRowIds.indexOf(active.id as string);
    const newIndex = sortedRowIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(sortedRowIds, oldIndex, newIndex);
    reorderRows.mutate(newOrder);
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedPropertyIds.indexOf(active.id as string);
    const newIndex = sortedPropertyIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sortedPropertyIds, oldIndex, newIndex);
    reordered.forEach((propId, idx) => {
      const prop = sortedProperties.find((p) => p.id === propId);
      if (prop && prop.order !== idx) {
        updateProperty.mutate({ id: propId, order: idx });
      }
    });
  };

  // Find first SELECT property for kanban grouping
  const groupByProperty = properties.find((p) => p.type === "SELECT");
  const canShowBoard = !!groupByProperty;

  const toggleView = () => {
    const newView = viewType === "TABLE" ? "BOARD" : "TABLE";
    updateViewType.mutate({ id: id!, viewType: newView });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editingName ? (
            <Input
              className="text-2xl font-bold h-auto py-0 px-1 border-none shadow-none focus-visible:ring-1 w-64"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                const trimmed = nameDraft.trim();
                if (trimmed && trimmed !== database.name) {
                  updateDatabase.mutate({ id: id!, name: trimmed });
                }
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setEditingName(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold tracking-tight cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
              onClick={() => {
                setNameDraft(database.name);
                setEditingName(true);
              }}
            >
              {database.name}
            </h1>
          )}
        </div>
        {canShowBoard && (
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewType === "TABLE" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none gap-1.5"
              onClick={() =>
                viewType !== "TABLE" &&
                updateViewType.mutate({ id: id!, viewType: "TABLE" })
              }
            >
              <TableProperties className="h-4 w-4" />
              Tabla
            </Button>
            <Button
              variant={viewType === "BOARD" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none gap-1.5"
              onClick={() =>
                viewType !== "BOARD" &&
                updateViewType.mutate({ id: id!, viewType: "BOARD" })
              }
            >
              <KanbanSquare className="h-4 w-4" />
              Tablero
            </Button>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Columns3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Sin columnas aún</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Añade tu primera columna para empezar a construir esta base de datos.
          </p>
          <Button onClick={() => setAddColOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir columna
          </Button>
        </div>
      ) : viewType === "BOARD" && groupByProperty ? (
        <KanbanBoard
          groupByProperty={groupByProperty}
          properties={properties}
          rows={sortedRows}
          onCreateRow={(cells) => createRow.mutate(cells)}
          onUpdateCell={(rowId, propertyId, value) =>
            upsertCell.mutate({ rowId, propertyId, value })
          }
          onDeleteRow={(rowId) => deleteRow.mutate(rowId)}
          onReorderRows={(orderedIds) => reorderRows.mutate(orderedIds)}
          isCreating={createRow.isPending}
        />
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleColumnDragEnd}
              >
                <SortableContext
                  items={sortedPropertyIds}
                  strategy={horizontalListSortingStrategy}
                >
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {sortedProperties.map((prop) => (
                      <SortableColumnHead
                        key={prop.id}
                        prop={prop}
                        onEditOptions={(p) => {
                          const opts = (p.config as { options?: string[] })?.options ?? [];
                          setEditingProp(p);
                          setEditOptions(opts);
                          setNewOption("");
                        }}
                        onDelete={(propId) => deleteProperty.mutate(propId)}
                      />
                    ))}
                    <TableHead className="w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setAddColOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </SortableContext>
              </DndContext>
            </TableHeader>
            <TableBody>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedRowIds}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedRows.map((row, idx) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      idx={idx}
                      properties={sortedProperties}
                      onDelete={handleDeleteRow}
                      onUpsertCell={handleUpsertCell}
                    />
                  ))}
                </SortableContext>
                {/* Add row button */}
                <TableRow>
                  <TableCell colSpan={sortedProperties.length + 2}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => createRow.mutate(undefined)}
                      disabled={createRow.isPending}
                    >
                      {createRow.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3 w-3" />
                      )}
                      Nueva fila
                    </Button>
                  </TableCell>
                </TableRow>
              </DndContext>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit SELECT Options Dialog */}
      <Dialog
        open={!!editingProp}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProp(null);
            setEditOptions([]);
            setNewOption("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opciones de "{editingProp?.name}"</DialogTitle>
            <DialogDescription>
              Añade o elimina las opciones disponibles para esta columna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {editOptions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin opciones todavía.
                </p>
              )}
              {editOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm px-2 py-1 rounded bg-muted truncate">
                    {opt}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() =>
                      setEditOptions(editOptions.filter((_, j) => j !== i))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nueva opción…"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = newOption.trim();
                    if (trimmed && !editOptions.includes(trimmed)) {
                      setEditOptions([...editOptions, trimmed]);
                      setNewOption("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const trimmed = newOption.trim();
                  if (trimmed && !editOptions.includes(trimmed)) {
                    setEditOptions([...editOptions, trimmed]);
                    setNewOption("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!editingProp) return;
                updateProperty.mutate(
                  { id: editingProp.id, config: { options: editOptions } },
                  {
                    onSuccess: () => {
                      setEditingProp(null);
                      setEditOptions([]);
                      setNewOption("");
                    },
                  }
                );
              }}
              disabled={updateProperty.isPending}
            >
              {updateProperty.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog
        open={addColOpen}
        onOpenChange={(open) => {
          setAddColOpen(open);
          if (!open) {
            setColName("");
            setColType("TEXT");
            setColRelationDatabaseId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir columna</DialogTitle>
            <DialogDescription>
              Elige un nombre y tipo para la nueva columna.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!colName.trim()) return;
              if (colType === "RELATION" && !colRelationDatabaseId) return;
              createProperty.mutate(
                {
                  name: colName.trim(),
                  type: colType,
                  ...(colType === "RELATION" && colRelationDatabaseId
                    ? { relationDatabaseId: colRelationDatabaseId }
                    : {}),
                },
                {
                  onSuccess: () => {
                    setAddColOpen(false);
                    setColName("");
                    setColType("TEXT");
                    setColRelationDatabaseId("");
                  },
                }
              );
            }}
          >
            <div className="space-y-3">
              <Input
                placeholder="Nombre de la columna"
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                autoFocus
              />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={colType}
                onChange={(e) => {
                  setColType(e.target.value as Property["type"]);
                  setColRelationDatabaseId("");
                }}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
              {colType === "RELATION" && (
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={colRelationDatabaseId}
                  onChange={(e) => setColRelationDatabaseId(e.target.value)}
                >
                  <option value="">Selecciona una base de datos…</option>
                  {(allDatabases ?? [])
                    .filter((db) => db.id !== id)
                    .map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  !colName.trim() ||
                  (colType === "RELATION" && !colRelationDatabaseId) ||
                  createProperty.isPending
                }
              >
                {createProperty.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Añadir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
