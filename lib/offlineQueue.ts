import Dexie, { type EntityTable } from 'dexie';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OperationType =
    | 'create_order'
    | 'close_order'
    | 'close_order_split'
    | 'update_order_status'
    | 'register_payment';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface PendingOperation {
    id: number;
    operation_type: OperationType;
    payload: Record<string, unknown>;
    created_at: string;
    sync_status: SyncStatus;
    retry_count: number;
    error_message?: string;
}

// ─── Dexie Database ───────────────────────────────────────────────────────────

class OfflineQueueDB extends Dexie {
    pending_operations!: EntityTable<PendingOperation, 'id'>;

    constructor() {
        super('RESTOGESTIÓNOfflineQueue');
        this.version(1).stores({
            pending_operations: '++id, operation_type, sync_status, created_at',
        });
    }
}

export const db = new OfflineQueueDB();

// ─── Queue API ────────────────────────────────────────────────────────────────

export const offlineQueue = {
    /** Add a new pending operation */
    async enqueue(type: OperationType, payload: Record<string, unknown>): Promise<number> {
        return db.pending_operations.add({
            operation_type: type,
            payload,
            created_at: new Date().toISOString(),
            sync_status: 'pending',
            retry_count: 0,
        } as Omit<PendingOperation, 'id'>);
    },

    /** Fetch all pending operations ordered by creation time */
    async getPending(): Promise<PendingOperation[]> {
        return db.pending_operations
            .where('sync_status')
            .anyOf(['pending', 'error'])
            .and((op) => op.retry_count < 5)
            .sortBy('created_at');
    },

    /** Count pending (not yet synced) operations */
    async countPending(): Promise<number> {
        return db.pending_operations
            .where('sync_status')
            .anyOf(['pending', 'syncing', 'error'])
            .count();
    },

    /** Mark a specific operation as successfully synced */
    async markSynced(id: number): Promise<void> {
        await db.pending_operations.update(id, { sync_status: 'synced' });
    },

    /** Mark a specific operation as failed */
    async markError(id: number, message: string): Promise<void> {
        const op = await db.pending_operations.get(id);
        await db.pending_operations.update(id, {
            sync_status: 'error',
            error_message: message,
            retry_count: (op?.retry_count ?? 0) + 1,
        });
    },

    /** Mark as syncing (in-progress) */
    async markSyncing(id: number): Promise<void> {
        await db.pending_operations.update(id, { sync_status: 'syncing' });
    },

    /** Purge all successfully synced operations (optional housekeeping) */
    async purgeSynced(): Promise<void> {
        await db.pending_operations.where('sync_status').equals('synced').delete();
    },
};
