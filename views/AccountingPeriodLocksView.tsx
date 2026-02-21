import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Branch } from '../types';

interface AccountingPeriodLocksViewProps {
    currentUser: User | null;
    branches: Branch[];
}

interface PeriodLock {
    id: string;
    branch_id: string;
    lock_date: string;
    cash_session_id: string;
    locked_by: string | null;
    created_at: string;
    branch_name?: string;
    locked_by_name?: string;
}

const AccountingPeriodLocksView: React.FC<AccountingPeriodLocksViewProps> = ({ currentUser, branches }) => {
    const [locks, setLocks] = useState<PeriodLock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLocks();
    }, []);

    const fetchLocks = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase
                .from('accounting_period_locks')
                .select(`
          *,
          branches:branch_id ( name ),
          locked_by_user:users!locked_by ( full_name )
        `)
                .order('lock_date', { ascending: false })
                .limit(200);

            if (fetchErr) throw fetchErr;

            const formatted: PeriodLock[] = (data || []).map((row: any) => ({
                id: row.id,
                branch_id: row.branch_id,
                lock_date: row.lock_date,
                cash_session_id: row.cash_session_id,
                locked_by: row.locked_by,
                created_at: row.created_at,
                branch_name: row.branches?.name || '—',
                locked_by_name: row.locked_by_user?.full_name || 'Sistema',
            }));

            setLocks(formatted);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-accent">lock_clock</span>
                    Períodos Contables Bloqueados
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Fechas cerradas para garantizar la integridad financiera. Una vez bloqueadas, no se pueden insertar ni modificar registros financieros para esa fecha y sucursal.
                </p>
            </header>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-3xl font-black text-slate-800">{locks.length}</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Períodos Bloqueados</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-3xl font-black text-slate-800">
                        {new Set(locks.map(l => l.branch_id)).size}
                    </p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Sucursales Afectadas</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm text-center">
                    <p className="text-3xl font-black text-emerald-600">
                        {locks.length > 0 ? new Date(locks[0].lock_date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mt-1">Último Período Cerrado</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons-round text-slate-400 text-[18px]">table_rows</span>
                        Registro de Bloqueos
                    </h2>
                    <button
                        onClick={fetchLocks}
                        className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
                    >
                        <span className="material-icons-round text-[14px]">refresh</span>
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div className="py-16 text-center text-slate-400 font-bold">
                        <span className="material-icons-round text-4xl animate-spin">refresh</span>
                    </div>
                )}

                {error && (
                    <div className="p-6 text-center">
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha Bloqueada</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Sesión de Caja</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Bloqueado Por</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Registrado el</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locks.map(lock => (
                                    <tr key={lock.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                                                <span className="font-black text-slate-800">
                                                    {new Date(lock.lock_date + 'T00:00:00').toLocaleDateString('es-ES', {
                                                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">
                                                {lock.branch_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                                {lock.cash_session_id.substring(0, 8)}…
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{lock.locked_by_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(lock.created_at).toLocaleString('es-ES')}
                                        </td>
                                    </tr>
                                ))}
                                {locks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-slate-400">
                                            <span className="material-icons-round text-4xl block mb-2">lock_open</span>
                                            <p className="font-bold">No hay períodos bloqueados todavía.</p>
                                            <p className="text-xs mt-1">Los períodos se bloquean automáticamente al cerrar una sesión de caja.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-icons-round text-amber-500 text-2xl flex-shrink-0">info</span>
                <div>
                    <p className="font-bold text-amber-800 mb-1">Protección de integridad financiera activa</p>
                    <p className="text-sm text-amber-700 leading-relaxed">
                        Cada fecha bloqueada protege <strong>Órdenes, Pagos, Gastos, Compras, Mermas y el Libro Mayor</strong> de modificaciones retroactivas. Los bloqueos se crean automáticamente al cerrar una sesión de caja y no pueden eliminarse desde la interfaz.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccountingPeriodLocksView;
