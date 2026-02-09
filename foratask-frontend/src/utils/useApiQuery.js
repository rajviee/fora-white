import { useQuery } from "@tanstack/react-query";
import api from "./api"; 

export function useApiQuery({
  key,
  url,
  params = {},
  enabled = true,
  select,
  onSuccess,
  onError,
  staleTime = 3 * 60 * 1000,
  gcTime = 5 * 60 * 1000, // Changed from cacheTime (deprecated in v5)
  refetchOnMount = true,
  keepPreviousData = false, // Add this option
}) {
  return useQuery({
    queryKey: [key, params],
    queryFn: async () => {
      const response = await api.get(url, { params });
      return response.data;
    },
    enabled,
    select,
    onSuccess,
    onError,
    staleTime,
    gcTime, // Use gcTime instead of cacheTime
    refetchOnMount,
    
    // CRITICAL: These prevent the flash of old data
    placeholderData: keepPreviousData ? (previousData) => previousData : undefined,
    
    // Don't show stale data while fetching new data
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  });
}