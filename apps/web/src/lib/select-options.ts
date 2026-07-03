export interface SelectOption {
  id: string;
  value: string;
  color: string;
}

// Paleta estilo Trello — el usuario también puede elegir un color totalmente
// personalizado mediante el selector nativo.
export const LABEL_COLORS: { name: string; hex: string }[] = [
  { name: "Verde", hex: "#4bce97" },
  { name: "Amarillo", hex: "#e2b203" },
  { name: "Naranja", hex: "#faa53d" },
  { name: "Rojo", hex: "#f87462" },
  { name: "Morado", hex: "#9f8fef" },
  { name: "Azul", hex: "#579dff" },
  { name: "Cian", hex: "#6cc3e0" },
  { name: "Lima", hex: "#94c748" },
  { name: "Rosa", hex: "#e774bb" },
  { name: "Gris", hex: "#8590a2" },
];

const FALLBACK_COLOR = "#8590a2";

// Los datos existentes guardan `options` como string[]; esta función admite
// ambos formatos para no requerir una migración de datos.
export function normalizeOptions(config: unknown): SelectOption[] {
  const raw = (config as { options?: unknown[] } | null | undefined)?.options ?? [];
  return raw.map((opt, i) => {
    if (typeof opt === "string") {
      return { id: opt, value: opt, color: LABEL_COLORS[i % LABEL_COLORS.length].hex };
    }
    const o = (opt ?? {}) as Partial<SelectOption>;
    return {
      id: o.id ?? o.value ?? String(i),
      value: o.value ?? "",
      color: o.color ?? LABEL_COLORS[i % LABEL_COLORS.length].hex,
    };
  });
}

export function getContrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1d2125" : "#ffffff";
}

export function nextLabelColor(usedCount: number): string {
  return LABEL_COLORS[usedCount % LABEL_COLORS.length].hex;
}

export { FALLBACK_COLOR };
