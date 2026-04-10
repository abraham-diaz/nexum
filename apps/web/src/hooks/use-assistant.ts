import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useAssistant() {
  return useMutation({
    mutationFn: (query: string) => api.askAssistant(query),
  });
}
