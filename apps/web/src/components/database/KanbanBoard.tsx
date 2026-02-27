import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Loader2, Trash2, GripVertical, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property, Row } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
          <span className="text-muted-foreground italic">Untitled</span>
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
  Todo: "bg-muted-foreground/20 text-muted-foreground",
  "In Progress": "bg-blue-500/20 text-blue-400",
  Done: "bg-green-500/20 text-green-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-muted-foreground/15 text-muted-foreground",
  Medium: "bg-yellow-500/15 text-yellow-500",
  High: "bg-red-500/15 text-red-500",
};

function getBadgeColor(value: string): string {
  return (
    STATUS_COLORS[value] ??
    PRIORITY_COLORS[value] ??
    "bg-muted-foreground/15 text-muted-foreground"
  );
}

function SortableCard({
  row,
  titleProp,
  badgeProps,
  dateProps,
  extraTextProps,
  groupByProperty,
  options,
  onUpdateCell,
  onDeleteRow,
}: {
  row: Row;
  titleProp: Property | undefined;
  badgeProps: Property[];
  dateProps: Property[];
  extraTextProps: Property[];
  groupByProperty: Property;
  options: string[];
  onUpdateCell: (rowId: string, propertyId: string, value: unknown) => void;
  onDeleteRow: (rowId: string) => void;
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

  const title = titleProp
    ? String(getCellValue(row, titleProp.id) ?? "")
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/card rounded-md border bg-background p-3 shadow-sm space-y-2"
    >
      {/* Title row with grip + delete */}
      <div className="flex items-start gap-1.5">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground mt-0.5"
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

      {/* Badges & dates */}
      {(badgeProps.length > 0 ||
        extraTextProps.length > 0 ||
        dateProps.length > 0) && (
        <div className="flex flex-wrap gap-1 items-center">
          {badgeProps.map((bp) => {
            const val = String(getCellValue(row, bp.id) ?? "");
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
          {dateProps.map((dp) => {
            const val = String(getCellValue(row, dp.id) ?? "");
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
          {extraTextProps.map((tp) => {
            const val = String(getCellValue(row, tp.id) ?? "");
            if (!val) return null;
            return (
              <span
                key={tp.id}
                className="inline-flex items-center text-[11px] text-muted-foreground"
              >
                {val}
              </span>
            );
          })}
        </div>
      )}

      {/* Status dropdown */}
      <select
        className="w-full text-xs rounded border border-input bg-transparent px-2 py-1"
        value={String(getCellValue(row, groupByProperty.id) ?? "")}
        onChange={(e) =>
          onUpdateCell(
            row.id,
            groupByProperty.id,
            e.target.value || null
          )
        }
        onMouseDown={(e) => e.stopPropagation()}
      >
        <option value="">No status</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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

  const badgeProps = properties.filter(
    (p) => p.type === "SELECT" && p.id !== groupByProperty.id
  );

  const dateProps = properties.filter((p) => p.type === "DATE");

  const extraTextProps = properties.filter(
    (p) => p.type === "TEXT" && p.id !== titleProp?.id
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getColumnForRow = (rowId: string): string => {
    for (const col of columns) {
      if (groupedRows[col]?.some((r) => r.id === rowId)) return col;
    }
    return "__uncategorized__";
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeRowId = active.id as string;
    const overId = over.id as string;

    const sourceCol = getColumnForRow(activeRowId);

    // Determine target column: if over is a column droppable, use it; otherwise find the column of the over row
    let targetCol: string;
    if (columns.includes(overId)) {
      targetCol = overId;
    } else {
      targetCol = getColumnForRow(overId);
    }

    // If moving to a different column, update the cell value
    if (sourceCol !== targetCol) {
      const newValue = targetCol === "__uncategorized__" ? null : targetCol;
      onUpdateCell(activeRowId, groupByProperty.id, newValue);
    }

    // Reorder within the target column
    const targetRows = groupedRows[targetCol] ?? [];
    const targetIds = targetRows.map((r) => r.id);

    if (sourceCol === targetCol) {
      // Same column: reorder
      const oldIndex = targetIds.indexOf(activeRowId);
      const newIndex = targetIds.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumnIds = arrayMove(targetIds, oldIndex, newIndex);
        // Build full ordered IDs from all columns
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
      // Cross-column: insert at position of over item, or at end if over is the column itself
      const overIndex = targetIds.indexOf(overId);
      const insertIndex = overIndex !== -1 ? overIndex : targetIds.length;

      // Build new target column ids with the moved row inserted
      const newTargetIds = [...targetIds];
      newTargetIds.splice(insertIndex, 0, activeRowId);

      // Remove from source
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

  // Custom collision detection: prefer pointerWithin, fallback to rectIntersection
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colRows = groupedRows[col] ?? [];
          const isUncategorized = col === "__uncategorized__";
          const label = isUncategorized ? "Uncategorized" : col;
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

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2 flex-1 min-h-25">
                <SortableContext
                  items={colRowIds}
                  strategy={verticalListSortingStrategy}
                >
                  {colRows.map((row) => (
                    <SortableCard
                      key={row.id}
                      row={row}
                      titleProp={titleProp}
                      badgeProps={badgeProps}
                      dateProps={dateProps}
                      extraTextProps={extraTextProps}
                      groupByProperty={groupByProperty}
                      options={options}
                      onUpdateCell={onUpdateCell}
                      onDeleteRow={onDeleteRow}
                    />
                  ))}
                </SortableContext>
              </div>

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
                  New
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
                ? String(getCellValue(activeRow, titleProp.id) ?? "Untitled")
                : "Untitled"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
