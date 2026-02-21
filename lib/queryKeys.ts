/**
 * Branch-aware query key factory.
 * All keys include branchId so that switching branches
 * automatically isolates cache entries.
 */
export const queryKeys = {
    /** All orders for a branch (or null = not yet ready) */
    orders: (branchId: string | null) => ['orders', branchId] as const,
    /** All tables for a branch */
    tables: (branchId: string | null) => ['tables', branchId] as const,
    /** All payments / closed sessions for a branch */
    payments: (branchId: string | null) => ['payments', branchId] as const,
    /** Inventory + ingredients merged view for a branch */
    inventory: (branchId: string | null) => ['inventory', branchId] as const,
} as const;
