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

            console.log('[useShiftPayments] Fetching for session:', cashSessionId);
            const { data, error } = await supabase
                .from('payments')
                .select('method, amount, cash_session_id')
                .eq('cash_session_id', cashSessionId);

            if (error) {
                console.error('[useShiftPayments] Error:', error);
                throw error;
            }

            console.log(`[useShiftPayments] Found ${data?.length || 0} payments`);
            const stats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

            (data || []).forEach(p => {
                const amount = parseFloat(p.amount?.toString() || '0');
                const method = (p.method || '').toLowerCase().trim();

                if (method === 'cash') stats.cash += amount;
                else if (method === 'card') stats.card += amount;
                else if (method === 'transfer') stats.transfer += amount;
                else stats.other += amount;

                stats.total += amount;
            });

            return stats;
        },
        enabled: !!cashSessionId,
        staleTime: 5000, // Reduced to 5s to be more reactive if realtime fails
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
