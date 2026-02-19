import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Order } from '../types';

export const useRealtimeOrders = (branchId: string | null) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchOrders = useCallback(async () => {
        if (!branchId) return;

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 2); // Keep it light, last 48h
            // For waiters, we only need recent active orders really. 
            // Broaden to 30 days if needed to match App.tsx, but speed is key here.

            // Let's stick to App.tsx logic (30 days) to match expectations
            const fetchDate = new Date();
            fetchDate.setDate(fetchDate.getDate() - 30);
            const startDateISO = fetchDate.toISOString();

            let query = supabase
                .from('orders')
                .select('*, order_items(*), users:waiter_id(full_name), cash_sessions(opened_by)');

            if (branchId === 'GLOBAL') {
                // If global, we might need all, but usually Waiter View is branch specific.
                // If View is used in Global mode, we might want to fetch all.
                // Assuming branchId is set for Waiter.
            } else {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query
                .or(`status.neq.cancelled,created_at.gte."${startDateISO}"`) // Fetch everything, let client side filter or refine query later? 
                // Actually, the original query was .or(`status.neq.paid,created_at.gte."${startDateISO}"`)
                // This means: (status != paid) OR (created_at >= 30 days ago). 
                .or(`status.in.(open,pending,preparing,ready,delivered,billing),created_at.gte."${startDateISO}"`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted: Order[] = data.map((o: any) => ({
                    id: o.id,
                    tableId: o.table_id,
                    items: (o.order_items || []).map((oi: any) => ({
                        plateId: oi.recipe_id,
                        qty: oi.quantity,
                        notes: oi.notes || undefined,
                    })),
                    status: o.status,
                    total: parseFloat(o.total || '0'),
                    timestamp: new Date(o.created_at),
                    waiterId: o.waiter_id,
                    waiterName: o.users?.full_name || 'Sin Asignar',
                    readyAt: o.ready_at,
                    servedAt: o.served_at,
                    servedBy: o.served_by,
                    branchId: o.branch_id,
                    shiftId: o.shift_id,
                    cashierId: o.cash_sessions?.opened_by,
                    paymentMethod: o.payment_method,
                    optimistic: false
                }));
                // Only update state if different to prevent re-renders? 
                // React handles this well usually, but we want to be sure.
                setOrders(formatted);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('[useRealtimeOrders] Error fetching:', err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    // Initial Fetch
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Polling (Heartbeat) - Every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // console.log('[useRealtimeOrders] ❤️ Heartbeat polling...');
            fetchOrders();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Realtime Listener
    useEffect(() => {
        if (!branchId) return;

        const channel = supabase.channel(`realtime-orders-${branchId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: branchId !== 'GLOBAL' ? `branch_id=eq.${branchId}` : undefined
            }, () => {
                console.log('[useRealtimeOrders] ⚡ Realtime Update (Orders) -> Refreshing');
                fetchOrders();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, () => {
                console.log('[useRealtimeOrders] ⚡ Realtime Update (Items) -> Refreshing');
                fetchOrders(); // Items don't have branch_id, so we just refetch if any item changes (RLS filters)
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [branchId, fetchOrders]);

    return { orders, loading, lastUpdated, refresh: fetchOrders };
};
