import { supabase } from '../supabaseClient';
import { offlineQueue } from '../lib/offlineQueue';

// ─── Types matching RPC signatures ─────────────────────────────────────────

export interface CreateOrderParams {
    p_branch_id: string;
    p_table_id: string;
    p_waiter_id: string | null;
    p_total: number;
    p_items: Array<{
        recipe_id: string;
        quantity: number;
        notes: string | null;
        unit_price: number;
    }>;
}

export interface CloseOrderParams {
    p_order_ids: string[];
    p_payment_method: string;
    p_total_paid: number;
    p_shift_id: string;
}

export interface CloseOrderSplitParams {
    p_order_ids: string[];
    p_payments: Array<{ method: string; amount: number }>;
    p_cash_session_id: string;
}

export interface RpcResult<T = unknown> {
    data: T | null;
    error: Error | null;
    isOffline?: boolean;
}

// ─── Network-aware RPC Service ──────────────────────────────────────────────

export const rpcService = {
    /**
     * create_order_atomic wrapper.
     * Online  → calls Supabase RPC directly.
     * Offline → stores in IndexedDB queue and returns a synthetic offline result.
     */
    async createOrder(params: CreateOrderParams): Promise<RpcResult<{ id: string; status: string }>> {
        if (navigator.onLine) {
            const { data, error } = await supabase.rpc('create_order_atomic', params);
            return { data, error: error as Error | null };
        }

        // OFFLINE PATH: queue and return synthetic pending result
        const queueId = await offlineQueue.enqueue('create_order', params as unknown as Record<string, unknown>);
        return {
            data: { id: `offline-${queueId}-${Date.now()}`, status: 'pending_sync' },
            error: null,
            isOffline: true,
        };
    },

    /**
     * close_order_with_payment wrapper.
     * Online  → calls Supabase RPC directly.
     * Offline → stores in IndexedDB queue.
     */
    async closeOrder(params: CloseOrderParams): Promise<RpcResult> {
        if (navigator.onLine) {
            const { data, error } = await supabase.rpc('close_order_with_payment', params);
            return { data, error: error as Error | null };
        }

        await offlineQueue.enqueue('close_order', params as unknown as Record<string, unknown>);
        return { data: null, error: null, isOffline: true };
    },

    async closeOrderSplit(params: CloseOrderSplitParams): Promise<RpcResult> {
        if (navigator.onLine) {
            const { data, error } = await supabase.rpc('close_order_with_split_payments', params);
            return { data, error: error as Error | null };
        }

        // Offline support for split payments? 
        // For now, let's enqueue as 'close_order_split'
        await offlineQueue.enqueue('close_order_split', params as unknown as Record<string, unknown>);
        return { data: null, error: null, isOffline: true };
    },
};
