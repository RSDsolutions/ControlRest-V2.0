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
                    notes: data.notes
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

    const openSession = async (initialCash: number, userId: string) => {
        if (!branchId) throw new Error("No Branch ID");

        try {
            const { data, error } = await supabase
                .rpc('open_cash_session', {
                    p_branch_id: branchId,
                    p_initial_cash: initialCash,
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

    const closeSession = async (actualCash: number, userId: string) => {
        if (!session) throw new Error("No active session to close");

        try {
            const { data, error } = await supabase
                .rpc('close_cash_session', {
                    p_session_id: session.id,
                    p_actual_cash: actualCash,
                    p_user_id: userId
                });

            if (error) throw error;

            await fetchSession(); // Should clear the session or update status?
            // Usually we want to clear the active session from state or show the closed summary
            // For now, refetching will likely return null (as get_active_session filters by 'open')
            // So we might want to return the result to the UI to show the summary before clearing.
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
