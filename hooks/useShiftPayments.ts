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

export function useShiftPayments(cashSessionId: string | null) {
    const [stats, setStats] = useState<ShiftStats>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!cashSessionId) {
            setStats(EMPTY_STATS);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('[useShiftPayments] Fetching payments for session:', cashSessionId);

            const { data, error: queryError } = await supabase
                .from('payments')
                .select('method, amount')
                .eq('cash_session_id', cashSessionId);

            if (queryError) {
                console.error('[useShiftPayments] Query error:', queryError);
                setError(queryError.message);
                return;
            }

            console.log('[useShiftPayments] Raw data from DB:', data);

            const newStats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

            (data || []).forEach(p => {
                const amount = parseFloat(p.amount?.toString() || '0');
                const method = (p.method || '').toLowerCase().trim();

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
    }, [cashSessionId]);

    // Fetch on mount and when session changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Realtime subscription to auto-refresh when payments change
    useEffect(() => {
        if (!cashSessionId) return;

        console.log('[useShiftPayments] Setting up realtime for session:', cashSessionId);
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
