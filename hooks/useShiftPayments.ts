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

            const { data, error } = await supabase
                .from('payments')
                .select('method, amount')
                .eq('cash_session_id', cashSessionId);

            if (error) throw error;

            const stats: ShiftStats = { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };

            (data || []).forEach(p => {
                const amount = parseFloat(p.amount || '0');
                const method = (p.method || '').toLowerCase();

                if (method === 'cash') stats.cash += amount;
                else if (method === 'card') stats.card += amount;
                else if (method === 'transfer') stats.transfer += amount;
                else stats.other += amount;

                stats.total += amount;
            });

            return stats;
        },
        enabled: !!cashSessionId,
        staleTime: 1000 * 60, // 1 minute
    });

    // Realtime invalidation
    useEffect(() => {
        if (!cashSessionId) return;

        const channel = supabase
            .channel(`rt-shift-payments-${cashSessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments',
                filter: `cash_session_id=eq.${cashSessionId}`
            }, () => {
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
