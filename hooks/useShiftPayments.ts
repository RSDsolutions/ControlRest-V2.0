import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export interface ShiftStats {
    cash: number;
    card: number;
    transfer: number;
    other: number;
    total: number;
}

const EMPTY_STATS: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

/**
 * Fetches shift payment stats using a SECURITY DEFINER RPC function.
 * This bypasses RLS auth.uid() issues by accepting explicit IDs as parameters.
 * Security is enforced inside the function: the session must belong to the restaurant.
 */
export function useShiftPayments(
    cashSessionId: string | null,
    restaurantId: string | null
) {
    const [stats, setStats] = useState<ShiftStats>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!cashSessionId || !restaurantId) {
            setStats(EMPTY_STATS);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('[useShiftPayments] Fetching via RPC for session:', cashSessionId, 'restaurant:', restaurantId);

            const { data, error: rpcError } = await supabase
                .rpc('get_session_payment_stats', {
                    p_session_id: cashSessionId,
                    p_restaurant_id: restaurantId
                });

            if (rpcError) {
                console.error('[useShiftPayments] RPC error:', rpcError);
                setError(rpcError.message);
                return;
            }

            console.log('[useShiftPayments] RPC returned rows:', data?.length || 0, data);

            const newStats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

            (data || []).forEach((row: { method: string; total: string | number }) => {
                const amount = parseFloat(row.total?.toString() || '0');
                const method = (row.method || '').toLowerCase().trim();

                if (method === 'cash') newStats.cash += amount;
                else if (method === 'card') newStats.card += amount;
                else if (method === 'transfer') newStats.transfer += amount;
                else newStats.other += amount;

                newStats.total += amount;
            });

            console.log('[useShiftPayments] Computed stats:', newStats);
            setStats(newStats);
        } catch (err: any) {
            console.error('[useShiftPayments] Unexpected error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [cashSessionId, restaurantId]);

    // Fetch on mount and when session changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Realtime subscription to auto-refresh when payments change
    useEffect(() => {
        if (!cashSessionId) return;

        const channel = supabase
            .channel(`rt-shift-payments-${cashSessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments',
                filter: `cash_session_id=eq.${cashSessionId}`
            }, (payload) => {
                console.log('[useShiftPayments] Realtime event:', payload.eventType);
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cashSessionId, fetchStats]);

    return {
        stats,
        isLoading,
        error,
        refresh: fetchStats,
    };
}
