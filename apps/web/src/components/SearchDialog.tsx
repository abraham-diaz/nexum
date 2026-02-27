import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Database, FileText, Search, Loader2 } from "lucide-react";
import { useSearch } from "@/hooks/use-search";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useSearch(query);

  useEffect(() => {
    if (open) {
      setQuery("");
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-background shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {isFetching ? (
            <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Search projects, databases, documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search…
            </p>
          ) : isLoading && !data ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            <>
              {data!.projects.length > 0 && (
                <ResultGroup
                  label="Projects"
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
                  label="Databases"
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
                  label="Documents"
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
