import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => api.searchAll(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    placeholderData: (prev) => prev,
  });
}
