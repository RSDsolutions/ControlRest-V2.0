import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { CashSession } from '../types';

export const useCashSession = (branchId: string | null) => {
    const [session, setSession] = useState<CashSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSession = useCallback(async () => {
        if (!branchId) {
            setSession(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('get_active_session', { p_branch_id: branchId });

            if (error) throw error;

            if (data) {
                // Map generic JSONB to CashSession if needed, but the structure matches
                setSession({
                    id: data.id,
                    restaurantId: data.restaurant_id,
                    branchId: data.branch_id,
                    openedBy: data.opened_by,
                    openedAt: new Date(data.opened_at),
                    initialCash: data.initial_cash,
                    status: data.status,
                    closedAt: data.closed_at ? new Date(data.closed_at) : undefined,
                    closedBy: data.closed_by,
                    expectedCash: data.expected_cash,
                    actualCash: data.actual_cash,
                    difference: data.difference,
                    notes: data.notes,
                    openingAmount: data.opening_amount,
                    openingComment: data.opening_comment,
                    countedCash: data.counted_cash,
                    countedCard: data.counted_card,
                    countedTransfer: data.counted_transfer,
                    countedOther: data.counted_other,
                    closingComment: data.closing_comment,
                    cashDifference: data.cash_difference
                });
            } else {
                setSession(null);
            }
        } catch (err: any) {
            console.error('Error fetching cash session:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const openSession = async (openingCash: number, comment: string, userId: string) => {
        if (!branchId) throw new Error("No Branch ID");

        try {
            const { data, error } = await supabase
                .rpc('open_cash_session', {
                    p_branch_id: branchId,
                    p_opening_cash: openingCash,
                    p_comment: comment,
                    p_user_id: userId
                });

            if (error) throw error;

            await fetchSession(); // Refresh to get full object
            return data;
        } catch (err) {
            console.error('Error opening session:', err);
            throw err;
        }
    };

    const closeSession = async (
        countedCash: number,
        countedCard: number,
        countedTransfer: number,
        countedOther: number,
        comment: string,
        userId: string
    ) => {
        if (!session) throw new Error("No active session to close");

        try {
            const { data, error } = await supabase
                .rpc('close_cash_session', {
                    p_session_id: session.id,
                    p_counted_cash: countedCash,
                    p_counted_card: countedCard,
                    p_counted_transfer: countedTransfer,
                    p_counted_other: countedOther,
                    p_comment: comment,
                    p_user_id: userId
                });

            if (error) throw error;

            await fetchSession();
            return data;
        } catch (err) {
            console.error('Error closing session:', err);
            throw err;
        }
    };

    return {
        session,
        loading,
        error,
        refreshSession: fetchSession,
        openSession,
        closeSession
    };
};
