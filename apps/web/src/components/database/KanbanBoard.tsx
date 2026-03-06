import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  Calendar,
  Hash,
  X,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Property, Row } from "@/lib/api";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  if (!editing) {
    return (
      <p
        className="text-sm font-medium leading-tight flex-1 min-w-0 cursor-text rounded px-1 -mx-1 hover:bg-muted/50"
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value);
          setEditing(true);
        }}
      >
        {value || (
          <span className="text-muted-foreground italic">Sin título</span>
        )}
      </p>
    );
  }

  return (
    <input
      ref={inputRef}
      className="text-sm font-medium leading-tight flex-1 min-w-0 bg-transparent border-none outline-none ring-1 ring-ring rounded px-1 -mx-1"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}

interface KanbanBoardProps {
  groupByProperty: Property;
  properties: Property[];
  rows: Row[];
  onCreateRow: (cells?: { propertyId: string; value: unknown }[]) => void;
  onUpdateCell: (rowId: string, propertyId: string, value: unknown) => void;
  onDeleteRow: (rowId: string) => void;
  onReorderRows: (orderedIds: string[]) => void;
  isCreating: boolean;
}

function getCellValue(row: Row, propertyId: string): unknown {
  const cell = row.cells.find((c) => c.propertyId === propertyId);
  return cell?.value ?? null;
}

const STATUS_COLORS: Record<string, string> = {
  Pendiente: "bg-muted-foreground/20 text-muted-foreground",
  "En progreso": "bg-blue-500/20 text-blue-400",
  Hecho: "bg-green-500/20 text-green-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Baja: "bg-muted-foreground/15 text-muted-foreground",
  Media: "bg-yellow-500/15 text-yellow-500",
  Alta: "bg-red-500/15 text-red-500",
};

function getBadgeColor(value: string): string {
  return (
    STATUS_COLORS[value] ??
    PRIORITY_COLORS[value] ??
    "bg-muted-foreground/15 text-muted-foreground"
  );
}

// --- Card Detail Dialog ---

function CardDetailDialog({
  row,
  properties,
  groupByProperty,
  open,
  onOpenChange,
  onUpdateCell,
  onDeleteRow,
}: {
  row: Row;
  properties: Property[];
  groupByProperty: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCell: (rowId: string, propertyId: string, value: unknown) => void;
  onDeleteRow: (rowId: string) => void;
}) {
  const cellMap = useMemo(
    () => new Map(row.cells.map((c) => [c.propertyId, c.value] as const)),
    [row.cells]
  );

  const titleProp =
    properties.find((p) => p.type === "TEXT" && p.order === 0) ??
    properties.find((p) => p.type === "TEXT");

  const title = titleProp ? String(cellMap.get(titleProp.id) ?? "") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{title || "Sin título"}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalle de la tarjeta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {properties.map((prop) => {
            const value = cellMap.get(prop.id) ?? null;

            if (prop.type === "TEXT") {
              return (
                <DetailTextField
                  key={prop.id}
                  label={prop.name}
                  value={String(value ?? "")}
                  multiline={prop.id !== titleProp?.id}
                  onSave={(val) => onUpdateCell(row.id, prop.id, val || null)}
                />
              );
            }

            if (prop.type === "NUMBER") {
              return (
                <DetailNumberField
                  key={prop.id}
                  label={prop.name}
                  value={value != null ? Number(value) : null}
                  onSave={(val) => onUpdateCell(row.id, prop.id, val)}
                />
              );
            }

            if (prop.type === "SELECT") {
              const opts =
                (prop.config as { options?: string[] })?.options ?? [];
              return (
                <DetailSelectField
                  key={prop.id}
                  label={prop.name}
                  value={String(value ?? "")}
                  options={opts}
                  onSave={(val) => onUpdateCell(row.id, prop.id, val || null)}
                />
              );
            }

            if (prop.type === "DATE") {
              return (
                <DetailDateField
                  key={prop.id}
                  label={prop.name}
                  value={String(value ?? "")}
                  onSave={(val) => onUpdateCell(row.id, prop.id, val || null)}
                />
              );
            }

            return null;
          })}
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onDeleteRow(row.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Eliminar tarjeta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailTextField({
  label,
  value,
  multiline,
  onSave,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft.trim() !== value) onSave(draft.trim());
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          placeholder={`Escribe aquí...`}
        />
      ) : (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder={`Escribe aquí...`}
        />
      )}
    </div>
  );
}

function DetailNumberField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number | null;
  onSave: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setDraft(value != null ? String(value) : "");
  }, [value]);

  const commit = () => {
    const num = draft.trim() === "" ? null : Number(draft);
    if (num !== value && (num === null || !isNaN(num))) onSave(num);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder="0"
      />
    </div>
  );
}

function DetailSelectField({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: string;
  options: string[];
  onSave: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={value}
        onChange={(e) => onSave(e.target.value)}
      >
        <option value="">--</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailDateField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onSave(e.target.value)}
      />
    </div>
  );
}

// --- Sortable Card ---

const SortableCard = memo(function SortableCard({
  row,
  titleProp,
  descriptionProp,
  badgeProps,
  dateProps,
  numberProps,
  groupByProperty,
  options,
  onUpdateCell,
  onDeleteRow,
  onOpenDetail,
}: {
  row: Row;
  titleProp: Property | undefined;
  descriptionProp: Property | undefined;
  badgeProps: Property[];
  dateProps: Property[];
  numberProps: Property[];
  groupByProperty: Property;
  options: string[];
  onUpdateCell: (rowId: string, propertyId: string, value: unknown) => void;
  onDeleteRow: (rowId: string) => void;
  onOpenDetail: (rowId: string) => void;
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
  const title = titleProp
    ? String(cellByPropertyId.get(titleProp.id) ?? "")
    : "";
  const description = descriptionProp
    ? String(cellByPropertyId.get(descriptionProp.id) ?? "")
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/card rounded-md border bg-background p-3 shadow-sm space-y-2 cursor-pointer hover:border-foreground/20 transition-colors"
      onClick={() => onOpenDetail(row.id)}
    >
      {/* Title row with grip + delete */}
      <div className="flex items-start gap-1.5">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground mt-0.5"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" />
        </button>
        <EditableTitle
          value={title}
          onSave={(val) => {
            if (titleProp) {
              onUpdateCell(row.id, titleProp.id, val);
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRow(row.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Description preview */}
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-4 px-1">
          {description}
        </p>
      )}

      {/* Badges, numbers & dates */}
      {(badgeProps.length > 0 ||
        numberProps.length > 0 ||
        dateProps.length > 0) && (
        <div className="flex flex-wrap gap-1 items-center">
          {badgeProps.map((bp) => {
            const val = String(cellByPropertyId.get(bp.id) ?? "");
            if (!val) return null;
            return (
              <span
                key={bp.id}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getBadgeColor(val)}`}
              >
                {val}
              </span>
            );
          })}
          {numberProps.map((np) => {
            const val = cellByPropertyId.get(np.id);
            if (val == null) return null;
            return (
              <span
                key={np.id}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                title={np.name}
              >
                <Hash className="h-2.5 w-2.5" />
                {String(val)}
              </span>
            );
          })}
          {dateProps.map((dp) => {
            const val = String(cellByPropertyId.get(dp.id) ?? "");
            if (!val) return null;
            const formatted = new Date(
              val + "T00:00:00"
            ).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return (
              <span
                key={dp.id}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                title={`${dp.name}: ${val}`}
              >
                <Calendar className="h-3 w-3" />
                {formatted}
              </span>
            );
          })}
        </div>
      )}

      {/* Description indicator if no description text but prop exists */}
      {descriptionProp && !description && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/40 px-1">
          <AlignLeft className="h-3 w-3" />
          <span>Sin descripción</span>
        </div>
      )}
    </div>
  );
});

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 p-2 flex-1 min-h-25 transition-colors ${isOver ? "bg-muted/50" : ""}`}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard({
  groupByProperty,
  properties,
  rows,
  onCreateRow,
  onUpdateCell,
  onDeleteRow,
  onReorderRows,
  isCreating,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);

  const config = groupByProperty.config as { options?: string[] } | null;
  const options = config?.options ?? [];
  const columns = [...options, "__uncategorized__"];

  const groupedRows: Record<string, Row[]> = useMemo(() => {
    const groups: Record<string, Row[]> = {};
    for (const col of columns) {
      groups[col] = [];
    }
    for (const row of rows) {
      const val = String(getCellValue(row, groupByProperty.id) ?? "");
      if (val && options.includes(val)) {
        groups[val].push(row);
      } else {
        groups["__uncategorized__"].push(row);
      }
    }
    return groups;
  }, [rows, groupByProperty.id, options.join(",")]);

  const titleProp =
    properties.find((p) => p.type === "TEXT" && p.order === 0) ??
    properties.find((p) => p.type === "TEXT");

  // First extra TEXT prop is the "description"
  const descriptionProp = properties.find(
    (p) => p.type === "TEXT" && p.id !== titleProp?.id
  );

  const badgeProps = properties.filter(
    (p) => p.type === "SELECT" && p.id !== groupByProperty.id
  );

  const dateProps = properties.filter((p) => p.type === "DATE");

  const numberProps = properties.filter((p) => p.type === "NUMBER");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getColumnForRow = (rowId: string): string | null => {
    for (const col of columns) {
      if (groupedRows[col]?.some((r) => r.id === rowId)) return col;
    }
    return null;
  };

  const findColumn = (id: string): string | null => {
    if (id.startsWith("column:")) return id.replace("column:", "");
    return getColumnForRow(id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeRowId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumn(activeRowId);
    const targetCol = findColumn(overId);

    if (!sourceCol || !targetCol || sourceCol === targetCol) return;

    const newValue = targetCol === "__uncategorized__" ? null : targetCol;
    onUpdateCell(activeRowId, groupByProperty.id, newValue);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeRowId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumn(activeRowId);
    const targetCol = findColumn(overId);

    if (!sourceCol || !targetCol) return;

    if (sourceCol !== targetCol) {
      const newValue = targetCol === "__uncategorized__" ? null : targetCol;
      onUpdateCell(activeRowId, groupByProperty.id, newValue);
    }

    const targetRows = groupedRows[targetCol] ?? [];
    const targetIds = targetRows.map((r) => r.id);

    if (sourceCol === targetCol) {
      const oldIndex = targetIds.indexOf(activeRowId);
      const overIndex = targetIds.indexOf(overId);
      if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
        const newColumnIds = arrayMove(targetIds, oldIndex, overIndex);
        const allOrderedIds: string[] = [];
        for (const col of columns) {
          if (col === targetCol) {
            allOrderedIds.push(...newColumnIds);
          } else {
            allOrderedIds.push(...(groupedRows[col] ?? []).map((r) => r.id));
          }
        }
        onReorderRows(allOrderedIds);
      }
    } else {
      const overIndex = targetIds.indexOf(overId);
      const insertIndex = overIndex !== -1 ? overIndex : targetIds.length;

      const newTargetIds = [...targetIds.filter((id) => id !== activeRowId)];
      newTargetIds.splice(insertIndex, 0, activeRowId);

      const sourceIds = (groupedRows[sourceCol] ?? [])
        .map((r) => r.id)
        .filter((id) => id !== activeRowId);

      const allOrderedIds: string[] = [];
      for (const col of columns) {
        if (col === targetCol) {
          allOrderedIds.push(...newTargetIds);
        } else if (col === sourceCol) {
          allOrderedIds.push(...sourceIds);
        } else {
          allOrderedIds.push(...(groupedRows[col] ?? []).map((r) => r.id));
        }
      }
      onReorderRows(allOrderedIds);
    }
  };

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;
  const detailRow = detailRowId
    ? rows.find((r) => r.id === detailRowId)
    : null;

  const handleOpenDetail = useCallback((rowId: string) => {
    setDetailRowId(rowId);
  }, []);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colRows = groupedRows[col] ?? [];
            const isUncategorized = col === "__uncategorized__";
            const label = isUncategorized ? "Sin categoría" : col;
            const colRowIds = colRows.map((r) => r.id);

            return (
              <div
                key={col}
                className="flex flex-col min-w-70 max-w-[320px] shrink-0 rounded-lg bg-muted/30 border"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {colRows.length}
                    </span>
                  </div>
                </div>

                {/* Cards — droppable column */}
                <DroppableColumn id={`column:${col}`}>
                  <SortableContext
                    items={colRowIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {colRows.map((row) => (
                      <SortableCard
                        key={row.id}
                        row={row}
                        titleProp={titleProp}
                        descriptionProp={descriptionProp}
                        badgeProps={badgeProps}
                        dateProps={dateProps}
                        numberProps={numberProps}
                        groupByProperty={groupByProperty}
                        options={options}
                        onUpdateCell={onUpdateCell}
                        onDeleteRow={onDeleteRow}
                        onOpenDetail={handleOpenDetail}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>

                {/* Add card button */}
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    disabled={isCreating}
                    onClick={() => {
                      const cells = isUncategorized
                        ? undefined
                        : [
                            {
                              propertyId: groupByProperty.id,
                              value: col,
                            },
                          ];
                      onCreateRow(cells);
                    }}
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-3 w-3" />
                    )}
                    Nuevo
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeRow ? (
            <div className="rounded-md border bg-background p-3 shadow-lg opacity-90 max-w-[300px]">
              <p className="text-sm font-medium">
                {titleProp
                  ? String(getCellValue(activeRow, titleProp.id) ?? "Sin título")
                  : "Sin título"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card detail dialog */}
      {detailRow && (
        <CardDetailDialog
          row={detailRow}
          properties={properties}
          groupByProperty={groupByProperty}
          open={!!detailRowId}
          onOpenChange={(open) => {
            if (!open) setDetailRowId(null);
          }}
          onUpdateCell={onUpdateCell}
          onDeleteRow={onDeleteRow}
        />
      )}
    </>
  );
}
