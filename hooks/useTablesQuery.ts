import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Table } from '../types';
import { queryKeys } from '../lib/queryKeys';

/**
 * Fetches and formats tables for a branch.
 * Handles GLOBAL mode when branchIds array is provided.
 */
async function fetchTables(
    branchId: string | null,
    branchIds?: string[]
): Promise<Table[]> {
    if (!branchId) return [];

    let query = supabase.from('tables').select('*');

    if (branchId === 'GLOBAL') {
        if (!branchIds || branchIds.length === 0) return [];
        query = query.in('branch_id', branchIds);
    } else {
        query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('label');
    if (error) throw error;

    return (data ?? []).map((t: any): Table => ({
        id: t.id,
        seats: t.seats,
        status: t.status,
        label: branchId === 'GLOBAL' ? `${t.label} (Sucursal)` : t.label,
        branchId: t.branch_id,
    }));
}

/**
 * TanStack Query hook for tables.
 * Automatically deduplicates requests from any component using the same branchId.
 */
export function useTablesQuery(
    branchId: string | null,
    branchIds: string[] = []
) {
    return useQuery({
        queryKey: branchId === 'GLOBAL'
            ? ['tables', 'GLOBAL', branchIds.length] as const
            : queryKeys.tables(branchId),
        queryFn: () => fetchTables(branchId, branchIds),
        enabled: !!branchId && (branchId !== 'GLOBAL' || branchIds.length > 0),
    });
}

export { fetchTables };
