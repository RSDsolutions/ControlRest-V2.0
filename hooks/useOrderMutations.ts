import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rpcService, CreateOrderParams, CloseOrderParams, CloseOrderSplitParams } from '../services/rpcService';
import { queryKeys } from '../lib/queryKeys';
import { Table } from '../types';

/**
 * useMutation for create_order_atomic.
 *
 * onSuccess:
 *   - Invalidates orders cache (triggers refetch)
 *   - Invalidates tables cache (triggers refetch)
 *
 * Optimistic table update is applied immediately via setQueryData
 * so the UI marks the table as "occupied" before the server confirms.
 */
export function useCreateOrderMutation(branchId: string | null) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateOrderParams) => rpcService.createOrder(params),

        // Optimistic: mark table as occupied immediately
        onMutate: async (params) => {
            await qc.cancelQueries({ queryKey: queryKeys.tables(branchId) });
            const prevTables = qc.getQueryData<Table[]>(queryKeys.tables(branchId));

            qc.setQueryData<Table[]>(queryKeys.tables(branchId), (old = []) =>
                old.map(t => t.id === params.p_table_id ? { ...t, status: 'occupied' } : t)
            );

            return { prevTables };
        },

        onSuccess: (_result, _params) => {
            // Invalidate both orders and tables so realtime data is fresh
            qc.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
            qc.invalidateQueries({ queryKey: queryKeys.tables(branchId) });
        },

        onError: (_err, _params, context) => {
            // Rollback optimistic table update on error
            if (context?.prevTables) {
                qc.setQueryData(queryKeys.tables(branchId), context.prevTables);
            }
        },
    });
}

/**
 * useMutation for close_order_with_payment.
 *
 * onSuccess:
 *   - Invalidates orders cache
 *   - Invalidates tables cache
 */
export function useCloseOrderMutation(branchId: string | null) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (params: CloseOrderParams) => rpcService.closeOrder(params),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
            qc.invalidateQueries({ queryKey: queryKeys.tables(branchId) });
        },
    });
}

/**
 * useMutation for close_order_with_split_payments.
 */
export function useCloseOrderSplitMutation(branchId: string | null) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (params: CloseOrderSplitParams) => rpcService.closeOrderSplit(params),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.orders(branchId) });
            qc.invalidateQueries({ queryKey: queryKeys.tables(branchId) });
        },
    });
}
