import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface ShiftStats {
    cash: number;
    card: number;
    transfer: number;
    other: number;
    total: number;
}

export function useShiftPayments(cashSessionId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['shift-payments', cashSessionId],
        queryFn: async (): Promise<ShiftStats> => {
            if (!cashSessionId) {
                return { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };
            }

            console.log('[useShiftPayments] Fetching via RPC for session:', cashSessionId);
            const { data, error } = await supabase
                .rpc('get_shift_payment_stats', { p_session_id: cashSessionId });

            if (error) {
                console.error('[useShiftPayments] RPC Error:', error);
                // Fallback to direct query if RPC fails
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('payments')
                    .select('method, amount')
                    .eq('cash_session_id', cashSessionId);
                if (fallbackError) throw fallbackError;
                const stats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };
                (fallbackData || []).forEach(p => {
                    const amount = parseFloat(p.amount?.toString() || '0');
                    const method = (p.method || '').toLowerCase().trim();
                    if (method === 'cash') stats.cash += amount;
                    else if (method === 'card') stats.card += amount;
                    else if (method === 'transfer') stats.transfer += amount;
                    else stats.other += amount;
                    stats.total += amount;
                });
                return stats;
            }

            console.log('[useShiftPayments] RPC returned rows:', data?.length || 0);
            const stats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

            (data || []).forEach((row: { method: string; total: string }) => {
                const amount = parseFloat(row.total?.toString() || '0');
                const method = (row.method || '').toLowerCase().trim();

                if (method === 'cash') stats.cash += amount;
                else if (method === 'card') stats.card += amount;
                else if (method === 'transfer') stats.transfer += amount;
                else stats.other += amount;

                stats.total += amount;
            });

            return stats;
        },
        enabled: !!cashSessionId,
        staleTime: 0, // Always fetch fresh data when session ID changes
        gcTime: 0,    // Don't cache old results
    });

    // Realtime invalidation
    useEffect(() => {
        if (!cashSessionId) return;

        console.log('[useShiftPayments] Subscribing to payments for session:', cashSessionId);
        const channel = supabase
            .channel(`rt-shift-payments-${cashSessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments',
                filter: `cash_session_id=eq.${cashSessionId}`
            }, (payload) => {
                console.log('[useShiftPayments] Realtime change detected:', payload.eventType);
                queryClient.invalidateQueries({ queryKey: ['shift-payments', cashSessionId] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cashSessionId, queryClient]);

    return {
        stats: query.data || { cash: 0, card: 0, transfer: 0, other: 0, total: 0 },
        isLoading: query.isLoading,
        error: query.error,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['shift-payments', cashSessionId] })
    };
}
