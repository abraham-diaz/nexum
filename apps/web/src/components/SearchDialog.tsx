import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Database,
  FileText,
  Search,
  Loader2,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { useAssistant } from "@/hooks/use-assistant";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [assistantMode, setAssistantMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useSearch(assistantMode ? "" : query);
  const assistant = useAssistant();

  useEffect(() => {
    if (open) {
      setQuery("");
      assistant.reset();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const hasResults =
    data &&
    (data.projects.length > 0 ||
      data.databases.length > 0 ||
      data.documents.length > 0);

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && assistantMode && query.trim()) {
      e.preventDefault();
      assistant.mutate(query.trim());
    }
  };

  const sourceIcon = (type: string) => {
    if (type === "project") return FolderKanban;
    if (type === "database") return Database;
    if (type === "document") return FileText;
    return TableProperties;
  };

  const sourcePath = (type: string, entityId: string) => {
    if (type === "project") return `/projects/${entityId}`;
    if (type === "database") return `/databases/${entityId}`;
    if (type === "document") return `/documents/${entityId}`;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-background shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {assistant.isPending || isFetching ? (
            <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
          ) : assistantMode ? (
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder={
              assistantMode
                ? "Pregunta al asistente..."
                : "Buscar proyectos, bases de datos, documentos..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => {
              setAssistantMode(!assistantMode);
              assistant.reset();
            }}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              assistantMode
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title={assistantMode ? "Modo busqueda" : "Modo asistente"}
          >
            <Sparkles size={12} />
            {assistantMode ? "IA" : "IA"}
          </button>
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {assistantMode ? (
            // --- Assistant mode ---
            query.length === 0 && !assistant.data ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Escribe tu pregunta y presiona Enter...
              </p>
            ) : assistant.isPending ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Pensando...
              </div>
            ) : assistant.data ? (
              <div className="space-y-3 px-3 py-2">
                {/* Answer */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {assistant.data.answer}
                </p>

                {/* Sources */}
                {assistant.data.sources.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      Fuentes
                    </p>
                    {assistant.data.sources.slice(0, 5).map((source) => {
                      const Icon = sourceIcon(source.type);
                      const path = sourcePath(source.type, source.entityId);
                      return (
                        <button
                          key={`${source.type}-${source.entityId}`}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                          onClick={() => path && goTo(path)}
                          disabled={!path}
                        >
                          <Icon
                            size={14}
                            className="shrink-0 text-muted-foreground"
                          />
                          <span className="truncate">
                            {source.title || source.body.slice(0, 60)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : assistant.isError ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">
                Error al consultar el asistente.
              </p>
            ) : null
          ) : (
            // --- Search mode ---
            <>
              {query.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Escribe para buscar...
                </p>
              ) : isLoading && !data ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Buscando...
                </p>
              ) : !hasResults ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Sin resultados.
                </p>
              ) : (
                <>
                  {data!.projects.length > 0 && (
                    <ResultGroup
                      label="Proyectos"
                      items={data!.projects.map((p) => ({
                        id: p.id,
                        name: p.name,
                        icon: FolderKanban,
                        path: `/projects/${p.id}`,
                      }))}
                      onSelect={goTo}
                    />
                  )}
                  {data!.databases.length > 0 && (
                    <ResultGroup
                      label="Bases de datos"
                      items={data!.databases.map((d) => ({
                        id: d.id,
                        name: d.name,
                        icon: Database,
                        path: `/databases/${d.id}`,
                      }))}
                      onSelect={goTo}
                    />
                  )}
                  {data!.documents.length > 0 && (
                    <ResultGroup
                      label="Documentos"
                      items={data!.documents.map((d) => ({
                        id: d.id,
                        name: d.title,
                        icon: FileText,
                        path: `/documents/${d.id}`,
                      }))}
                      onSelect={goTo}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResultItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  path: string;
}

function ResultGroup({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: ResultItem[];
  onSelect: (path: string) => void;
}) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
            onClick={() => onSelect(item.path)}
          >
            <Icon size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
