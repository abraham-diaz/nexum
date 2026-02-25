import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

const DATABASES_KEY = ["databases"];

export function useDatabases() {
  return useQuery({
    queryKey: DATABASES_KEY,
    queryFn: api.getDatabases,
  });
}

export function useCreateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, projectId }: { name: string; projectId: string }) =>
      api.createDatabase(name, projectId),
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
