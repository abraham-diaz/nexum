import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Columns3,
} from "lucide-react";
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
  useDeleteProperty,
  useCreateRow,
  useDeleteRow,
  useUpsertCell,
} from "@/hooks/use-database";
import type { Property, Row } from "@/lib/api";

function EditableCell({
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
        className="min-h-[32px] px-2 py-1 cursor-text rounded hover:bg-muted/50"
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
}

function getCellValue(row: Row, propertyId: string): unknown {
  const cell = row.cells.find((c) => c.propertyId === propertyId);
  return cell?.value ?? null;
}

const PROPERTY_TYPES = ["TEXT", "NUMBER", "SELECT", "RELATION"] as const;

export default function DatabaseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: database, isLoading: dbLoading, error: dbError } = useDatabase(id!);
  const { data: rows, isLoading: rowsLoading } = useRows(id!);

  const createProperty = useCreateProperty(id!);
  const deleteProperty = useDeleteProperty(id!);
  const createRow = useCreateRow(id!);
  const deleteRow = useDeleteRow(id!);
  const upsertCell = useUpsertCell(id!);

  const [addColOpen, setAddColOpen] = useState(false);
  const [colName, setColName] = useState("");
  const [colType, setColType] = useState<Property["type"]>("TEXT");

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
          {dbError?.message ?? "Database not found."}
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const properties = database.properties ?? [];
  const sortedRows = [...(rows ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{database.name}</h1>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Columns3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No columns yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add your first column to start building this database.
          </p>
          <Button onClick={() => setAddColOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {properties.map((prop) => (
                  <TableHead key={prop.id} className="min-w-[150px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{prop.name}</span>
                      <span className="text-[10px] text-muted-foreground font-normal uppercase">
                        {prop.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/head:opacity-100 shrink-0"
                        onClick={() => deleteProperty.mutate(prop.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableHead>
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
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <span>{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteRow.mutate(row.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  {properties.map((prop) => (
                    <TableCell key={prop.id} className="p-0">
                      <EditableCell
                        value={getCellValue(row, prop.id)}
                        onSave={(value) =>
                          upsertCell.mutate({
                            rowId: row.id,
                            propertyId: prop.id,
                            value,
                          })
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))}
              {/* Add row button */}
              <TableRow>
                <TableCell colSpan={properties.length + 2}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => createRow.mutate()}
                    disabled={createRow.isPending}
                  >
                    {createRow.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-3 w-3" />
                    )}
                    New Row
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Column Dialog */}
      <Dialog
        open={addColOpen}
        onOpenChange={(open) => {
          setAddColOpen(open);
          if (!open) {
            setColName("");
            setColType("TEXT");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
            <DialogDescription>
              Choose a name and type for the new column.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!colName.trim()) return;
              createProperty.mutate(
                { name: colName.trim(), type: colType },
                {
                  onSuccess: () => {
                    setAddColOpen(false);
                    setColName("");
                    setColType("TEXT");
                  },
                }
              );
            }}
          >
            <div className="space-y-3">
              <Input
                placeholder="Column name"
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                autoFocus
              />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={colType}
                onChange={(e) =>
                  setColType(e.target.value as Property["type"])
                }
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!colName.trim() || createProperty.isPending}
              >
                {createProperty.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
