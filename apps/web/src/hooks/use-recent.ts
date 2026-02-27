import { useState, useCallback, useEffect } from "react";

export interface RecentItem {
  id: string;
  type: "database" | "document";
  name: string;
  path: string;
  visitedAt: number;
}

const STORAGE_KEY = "nexum:recent-items";
const MAX_ITEMS = 5;

function loadItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>(loadItems);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadItems());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback(
    (item: Omit<RecentItem, "visitedAt">) => {
      setItems((prev) => {
        const filtered = prev.filter(
          (i) => !(i.id === item.id && i.type === item.type)
        );
        const next = [
          { ...item, visitedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        saveItems(next);
        return next;
      });
    },
    []
  );

  const keepOnlyExisting = useCallback(
    (validDatabaseIds: string[], validDocumentIds: string[]) => {
      const validDatabases = new Set(validDatabaseIds);
      const validDocuments = new Set(validDocumentIds);

      setItems((prev) => {
        const next = prev.filter((item) => {
          if (item.type === "database") return validDatabases.has(item.id);
          return validDocuments.has(item.id);
        });

        if (next.length !== prev.length) {
          saveItems(next);
        }

        return next;
      });
    },
    []
  );

  return { items, addItem, keepOnlyExisting };
}
