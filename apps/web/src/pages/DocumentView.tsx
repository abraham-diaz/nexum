import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { useRecentItems } from "@/hooks/use-recent";

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: doc, isLoading, error } = useDocument(id!);
  const updateMutation = useUpdateDocument();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [saved, setSaved] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { addItem: addRecent } = useRecentItems();

  useEffect(() => {
    if (doc) setTitleValue(doc.title);
  }, [doc]);

  useEffect(() => {
    if (doc) {
      addRecent({
        id: doc.id,
        type: "document",
        name: doc.title,
        path: `/documents/${doc.id}`,
      });
    }
  }, [doc?.id, doc?.title]);

  const saveContent = useCallback(
    (content: unknown) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateMutation.mutate(
          { id: id!, data: { content } },
          {
            onSuccess: () => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            },
          }
        );
      }, 1000);
    },
    [id, updateMutation]
  );

  const saveTitle = () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== doc?.title) {
      updateMutation.mutate({ id: id!, data: { title: trimmed } });
    } else if (doc) {
      setTitleValue(doc.title);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Failed to load document.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitleValue(doc.title);
                setEditingTitle(false);
              }
            }}
            className="text-2xl font-bold h-auto py-0 border-none shadow-none focus-visible:ring-1 max-w-md"
            autoFocus
          />
        ) : (
          <h1
            className="text-2xl font-bold tracking-tight cursor-pointer hover:text-muted-foreground transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {doc.title}
          </h1>
        )}

        {saved && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="document-light rounded-lg p-6 shadow-sm">
        <TiptapEditor content={doc.content} onUpdate={saveContent} />
      </div>
    </div>
  );
}
