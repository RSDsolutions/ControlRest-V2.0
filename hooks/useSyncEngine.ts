import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../supabaseClient';
import { offlineQueue } from '../lib/offlineQueue';

const SYNC_INTERVAL_MS = 5000; // 5 seconds

/**
 * Background sync engine.
 * Runs every 5 s when online, flushing pending_operations in FIFO order.
 * Returns { pendingCount, lastSyncAt } for UI feedback.
 */
export function useSyncEngine() {
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
    const isSyncing = useRef(false);

    const refreshCount = useCallback(async () => {
        const count = await offlineQueue.countPending();
        setPendingCount(count);
    }, []);

    const syncNow = useCallback(async () => {
        if (!navigator.onLine || isSyncing.current) return;
        isSyncing.current = true;

        try {
            const ops = await offlineQueue.getPending();
            if (ops.length === 0) return;

            for (const op of ops) {
                await offlineQueue.markSyncing(op.id);

                try {
                    let rpcError: unknown = null;

                    if (op.operation_type === 'create_order') {
                        const { error } = await supabase.rpc('create_order_atomic', op.payload as never);
                        rpcError = error;
                    } else if (op.operation_type === 'close_order') {
                        const { error } = await supabase.rpc('close_order_with_payment', op.payload as never);
                        rpcError = error;
                    } else if (op.operation_type === 'update_order_status') {
                        const { error } = await supabase
                            .from('orders')
                            .update({ status: (op.payload as any).status })
                            .eq('id', (op.payload as any).order_id);
                        rpcError = error;
                    } else if (op.operation_type === 'register_payment') {
                        const { error } = await supabase.rpc('close_order_with_payment', op.payload as never);
                        rpcError = error;
                    }

                    if (rpcError) {
                        const msg = (rpcError as any)?.message ?? String(rpcError);
                        await offlineQueue.markError(op.id, msg);
                    } else {
                        await offlineQueue.markSynced(op.id);
                    }
                } catch (e) {
                    await offlineQueue.markError(op.id, String(e));
                }
            }

            // Housekeeping: remove synced records older than 24 h
            await offlineQueue.purgeSynced();
            setLastSyncAt(new Date());
        } finally {
            isSyncing.current = false;
            await refreshCount();
        }
    }, [refreshCount]);

    useEffect(() => {
        // Initial count on mount
        refreshCount();

        // Periodic sync loop
        const interval = setInterval(syncNow, SYNC_INTERVAL_MS);

        // Also sync immediately when coming back online
        const handleOnline = () => { void syncNow(); };
        window.addEventListener('online', handleOnline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
        };
    }, [syncNow, refreshCount]);

    return { pendingCount, lastSyncAt, syncNow, refreshCount };
}
