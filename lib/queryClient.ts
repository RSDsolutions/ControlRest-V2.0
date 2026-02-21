import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient for the entire application.
 * staleTime: 30s  — data considered fresh for 30 seconds
 * gcTime:    5min  — keeps cache alive for 5 minutes after last subscribed component unmounts
 * retry:     1     — one retry on network failure before surfacing error
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
        },
    },
});
