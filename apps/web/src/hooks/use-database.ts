import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useDatabase(id: string) {
  return useQuery({
    queryKey: ["databases", id],
    queryFn: () => api.getDatabase(id),
  });
}

export function useRows(databaseId: string) {
  return useQuery({
    queryKey: ["databases", databaseId, "rows"],
    queryFn: () => api.getRows(databaseId),
  });
}

export function useCreateProperty(databaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: api.Property["type"] }) =>
      api.createProperty(databaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases", databaseId] });
      queryClient.invalidateQueries({
        queryKey: ["databases", databaseId, "rows"],
      });
    },
  });
}

export function useDeleteProperty(databaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProperty(databaseId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases", databaseId] });
      queryClient.invalidateQueries({
        queryKey: ["databases", databaseId, "rows"],
      });
    },
  });
}

export function useCreateRow(databaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cells?: { propertyId: string; value: unknown }[]) =>
      api.createRow(databaseId, cells),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["databases", databaseId, "rows"],
      });
    },
  });
}

export function useDeleteRow(databaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRow(databaseId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["databases", databaseId, "rows"],
      });
    },
  });
}

export function useUpsertCell(databaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rowId,
      propertyId,
      value,
    }: {
      rowId: string;
      propertyId: string;
      value: unknown;
    }) => api.upsertCell(rowId, propertyId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["databases", databaseId, "rows"],
      });
    },
  });
}
