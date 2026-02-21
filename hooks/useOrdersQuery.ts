import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Order } from '../types';
import { queryKeys } from '../lib/queryKeys';

/**
 * Fetches and formats orders for a branch.
 * Handles GLOBAL mode when branchIds array is provided.
 */
async function fetchOrders(
    branchId: string | null,
    branchIds?: string[]
): Promise<Order[]> {
    if (!branchId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    const startDateISO = startDate.toISOString();

    let query = supabase
        .from('orders')
        .select('*, order_items(*), users:waiter_id(full_name), cash_sessions(opened_by)');

    if (branchId === 'GLOBAL') {
        if (!branchIds || branchIds.length === 0) return [];
        query = query.in('branch_id', branchIds);
    } else {
        query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query
        .or(`status.neq.paid,created_at.gte."${startDateISO}"`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((o: any): Order => ({
        id: o.id,
        tableId: o.table_id,
        items: (o.order_items ?? []).map((oi: any) => ({
            plateId: oi.recipe_id,
            qty: oi.quantity,
            notes: oi.notes || undefined,
        })),
        status: o.status,
        total: parseFloat(o.total || '0'),
        timestamp: new Date(o.created_at),
        waiterId: o.waiter_id,
        waiterName: o.users?.full_name ?? 'Sin Asignar',
        readyAt: o.ready_at,
        servedAt: o.served_at,
        servedBy: o.served_by,
        branchId: o.branch_id,
        shiftId: o.shift_id,
        cashierId: o.cash_sessions?.opened_by,
        paymentMethod: o.payment_method,
        optimistic: false,
    }));
}

/**
 * TanStack Query hook for orders.
 * Automatically deduplicates requests from any component using the same branchId.
 */
export function useOrdersQuery(
    branchId: string | null,
    branchIds: string[] = []
) {
    return useQuery({
        // For GLOBAL mode, include branchIds.length so the key changes when branches load
        queryKey: branchId === 'GLOBAL'
            ? ['orders', 'GLOBAL', branchIds.length] as const
            : queryKeys.orders(branchId),
        queryFn: () => fetchOrders(branchId, branchIds),
        enabled: !!branchId && (branchId !== 'GLOBAL' || branchIds.length > 0),
    });
}

// Export the fetch function for use as a queryFn in the refactored useRealtimeOrders
export { fetchOrders };
