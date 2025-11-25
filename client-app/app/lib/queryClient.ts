import { QueryClient } from "@tanstack/react-query";

// Singleton QueryClient for use in both client components and collections
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});
