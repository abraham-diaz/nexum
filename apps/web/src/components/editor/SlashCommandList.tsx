import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  Minus,
  Table,
  Type,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const items: SlashCommandItem[] = [
  {
    title: "Texto",
    description: "Texto normal",
    icon: <Type className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Título 1",
    description: "Título grande",
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Título 2",
    description: "Título mediano",
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Título 3",
    description: "Título pequeño",
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Lista",
    description: "Lista con viñetas",
    icon: <List className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    description: "Lista ordenada",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Cita",
    description: "Bloque de cita",
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Código",
    description: "Bloque de código",
    icon: <Code className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Lista de tareas",
    description: "Lista con checkboxes",
    icon: <ListTodo className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Divisor",
    description: "Línea horizontal",
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Tabla",
    description: "Insertar una tabla",
    icon: <Table className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

interface SlashCommandListProps {
  editor: Editor;
  query: string;
  range: { from: number; to: number };
}

export default forwardRef(function SlashCommandList(
  { editor, query, range }: SlashCommandListProps,
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        editor.chain().focus().deleteRange(range).run();
        item.command(editor);
      }
    },
    [editor, filtered, range]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev >= filtered.length - 1 ? 0 : prev + 1));
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (filtered.length === 0) {
    return (
      <div className="z-50 rounded-lg border bg-popover p-2 shadow-md">
        <p className="text-sm text-muted-foreground px-2 py-1">Sin resultados</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="z-50 w-56 rounded-lg border bg-popover shadow-md overflow-y-auto max-h-64"
    >
      {filtered.map((item, index) => (
        <button
          key={item.title}
          onClick={() => selectItem(index)}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
            {item.icon}
          </span>
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
});
