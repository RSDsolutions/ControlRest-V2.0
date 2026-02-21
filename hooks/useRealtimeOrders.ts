import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { queryKeys } from '../lib/queryKeys';
import { useOrdersQuery } from './useOrdersQuery';

/**
 * Thin realtime-aware orders hook backed by TanStack Query.
 *
 * What changed vs the old implementation:
 * - No internal useState / polling interval
 * - Data lives in the TanStack Query cache (queryKeys.orders)
 * - Realtime events → queryClient.invalidateQueries() → single consistent refetch
 * - Multiple components subscribing to the same branchId share ONE network request
 *
 * Public interface is unchanged so no consumer needs to update imports.
 */
export const useRealtimeOrders = (branchId: string | null) => {
    const queryClient = useQueryClient();
    const { data: orders = [], isLoading: loading, dataUpdatedAt, refetch } = useOrdersQuery(branchId);

    const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
    };

    // Realtime listener: on Postgres change → invalidate query cache.
    // Realtime no longer triggers a full re-fetch itself; that's TanStack Query's job.
    useEffect(() => {
        if (!branchId) return;

        const filterStr = branchId !== 'GLOBAL'
            ? `branch_id=eq.${branchId}`
            : undefined;

        const channel = supabase
            .channel(`rtq-orders-${branchId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: filterStr,
            }, () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items',
            }, () => {
                // order_items lack branch_id; RLS ensures we only see ours
                queryClient.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [branchId, queryClient]);

    return { orders, loading, lastUpdated, refresh };
};
