import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

const DATABASES_KEY = ["databases"];

export function useDatabases() {
  return useQuery({
    queryKey: DATABASES_KEY,
    queryFn: api.getDatabases,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["databases", "templates"],
    queryFn: api.getTemplates,
    staleTime: Infinity,
  });
}

export function useCreateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      projectId,
      templateId,
    }: {
      name: string;
      projectId: string;
      templateId?: string;
    }) => api.createDatabase(name, projectId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATABASES_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.updateDatabase(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATABASES_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATABASES_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateViewType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      viewType,
    }: {
      id: string;
      viewType: "TABLE" | "BOARD";
    }) => api.updateDatabaseViewType(id, viewType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["databases", variables.id],
      });
    },
  });
}
