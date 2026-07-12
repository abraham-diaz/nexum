import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LABEL_COLORS,
  getContrastText,
  nextLabelColor,
  type SelectOption,
} from "@/lib/select-options";

export function LabelPicker({
  options,
  selected,
  onToggle,
  onCreate,
}: {
  options: SelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => nextLabelColor(options.length));

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || options.some((o) => o.value === trimmed)) return;
    onCreate(trimmed, color);
    setName("");
    setColor(nextLabelColor(options.length + 1));
  };

  return (
    <div className="w-64 space-y-2">
      {options.length > 0 && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted text-left"
                onClick={() => onToggle(opt.value)}
              >
                <span
                  className="flex-1 rounded px-2 py-1 text-xs font-medium truncate"
                  style={{ backgroundColor: opt.color, color: getContrastText(opt.color) }}
                >
                  {opt.value}
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      <div className="border-t pt-2 space-y-2">
        <Input
          className="h-8"
          placeholder="Crear etiqueta…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center gap-1.5">
          <div className="flex flex-wrap gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                className="h-5 w-5 rounded-full border-2"
                style={{
                  backgroundColor: c.hex,
                  borderColor:
                    color.toLowerCase() === c.hex.toLowerCase()
                      ? "var(--foreground)"
                      : "transparent",
                }}
                onClick={() => setColor(c.hex)}
              />
            ))}
          </div>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs shrink-0 disabled:opacity-40 hover:bg-muted"
            disabled={!name.trim()}
            onClick={submit}
          >
            <Plus className="h-3 w-3" />
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
