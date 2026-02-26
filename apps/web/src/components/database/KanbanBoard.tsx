import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, Trash2, GripVertical, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property, Row } from "@/lib/api";

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
  isCreating: boolean;
}

function getCellValue(row: Row, propertyId: string): unknown {
  const cell = row.cells.find((c) => c.propertyId === propertyId);
  return cell?.value ?? null;
}

const STATUS_COLORS: Record<string, string> = {
  Todo: "bg-zinc-500/20 text-zinc-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  Done: "bg-green-500/20 text-green-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-zinc-500/15 text-zinc-500",
  Medium: "bg-yellow-500/15 text-yellow-500",
  High: "bg-red-500/15 text-red-500",
};

function getBadgeColor(value: string): string {
  return (
    STATUS_COLORS[value] ??
    PRIORITY_COLORS[value] ??
    "bg-zinc-500/15 text-zinc-400"
  );
}

export default function KanbanBoard({
  groupByProperty,
  properties,
  rows,
  onCreateRow,
  onUpdateCell,
  onDeleteRow,
  isCreating,
}: KanbanBoardProps) {
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const config = groupByProperty.config as { options?: string[] } | null;
  const options = config?.options ?? [];
  const columns = [...options, "__uncategorized__"];

  const groupedRows: Record<string, Row[]> = {};
  for (const col of columns) {
    groupedRows[col] = [];
  }
  for (const row of rows) {
    const val = String(getCellValue(row, groupByProperty.id) ?? "");
    if (val && options.includes(val)) {
      groupedRows[val].push(row);
    } else {
      groupedRows["__uncategorized__"].push(row);
    }
  }

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

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    setDraggedRowId(rowId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", rowId);
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTarget !== col) setDropTarget(col);
  };

  const handleDragLeave = (e: React.DragEvent, col: string) => {
    const related = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!related || !currentTarget.contains(related)) {
      if (dropTarget === col) setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDropTarget(null);
    const rowId = e.dataTransfer.getData("text/plain");
    if (!rowId) return;

    const isUncategorized = col === "__uncategorized__";
    const newValue = isUncategorized ? null : col;

    // Only update if actually moving to a different column
    const currentValue = String(
      getCellValue(
        rows.find((r) => r.id === rowId)!,
        groupByProperty.id
      ) ?? ""
    );
    const currentCol =
      currentValue && options.includes(currentValue)
        ? currentValue
        : "__uncategorized__";

    if (currentCol !== col) {
      onUpdateCell(rowId, groupByProperty.id, newValue);
    }
    setDraggedRowId(null);
  };

  const handleDragEnd = () => {
    setDraggedRowId(null);
    setDropTarget(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colRows = groupedRows[col] ?? [];
        const isUncategorized = col === "__uncategorized__";
        const label = isUncategorized ? "Uncategorized" : col;
        const isOver = dropTarget === col;

        return (
          <div
            key={col}
            className={`flex flex-col min-w-70 max-w-[320px] shrink-0 rounded-lg bg-muted/30 border transition-colors ${
              isOver ? "border-primary/50 bg-primary/5" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={(e) => handleDragLeave(e, col)}
            onDrop={(e) => handleDrop(e, col)}
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
              {colRows.map((row) => {
                const title = titleProp
                  ? String(getCellValue(row, titleProp.id) ?? "")
                  : "";
                const isDragging = draggedRowId === row.id;

                return (
                  <div
                    key={row.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, row.id)}
                    onDragEnd={handleDragEnd}
                    className={`group/card rounded-md border bg-background p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing transition-opacity ${
                      isDragging ? "opacity-40" : ""
                    }`}
                  >
                    {/* Title row with grip + delete */}
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover/card:opacity-100 transition-opacity" />
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
                          const val = String(
                            getCellValue(row, bp.id) ?? ""
                          );
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
                          const val = String(
                            getCellValue(row, dp.id) ?? ""
                          );
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
                          const val = String(
                            getCellValue(row, tp.id) ?? ""
                          );
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
                      value={String(
                        getCellValue(row, groupByProperty.id) ?? ""
                      )}
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
              })}
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
  );
}
