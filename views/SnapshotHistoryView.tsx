import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Branch, DailyFinancialSnapshot } from '../types';

interface SnapshotHistoryViewProps {
    currentUser: User | null;
    branches: Branch[];
}

const fmt = (n: number) =>
    `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ProfitBadge: React.FC<{ value: number }> = ({ value }) => {
    const positive = value >= 0;
    return (
        <span className={`font-mono font-black ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? '+' : ''}{fmt(value)}
        </span>
    );
};

const SnapshotHistoryView: React.FC<SnapshotHistoryViewProps> = ({ branches }) => {
    const [snapshots, setSnapshots] = useState<DailyFinancialSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchSnapshots(); }, []);

    const fetchSnapshots = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('daily_branch_financial_snapshots')
                .select('*, branches!branch_id(name)')
                .order('snapshot_date', { ascending: false })
                .limit(180);

            if (err) throw err;

            setSnapshots((data || []).map((r: any) => ({
                id: r.id,
                branchId: r.branch_id,
                snapshotDate: r.snapshot_date,
                cashSessionId: r.cash_session_id,
                totalSales: Number(r.total_sales),
                totalCogs: Number(r.total_cogs),
                totalExpenses: Number(r.total_expenses),
                totalWasteCost: Number(r.total_waste_cost),
                grossProfit: Number(r.gross_profit),
                netProfit: Number(r.net_profit),
                inventoryValue: Number(r.inventory_value),
                createdAt: r.created_at,
                branchName: r.branches?.name ?? '—',
            })));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Summary stats
    const totalSales = snapshots.reduce((a, s) => a + s.totalSales, 0);
    const totalNet = snapshots.reduce((a, s) => a + s.netProfit, 0);
    const avgMargin = totalSales > 0 ? (totalNet / totalSales) * 100 : 0;

    return (
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-accent">assessment</span>
                    Snapshots Financieros Diarios
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Resumen financiero pre-calculado por sesión de caja. Se genera automáticamente al cerrar cada turno.
                </p>
            </header>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Snapshots', value: String(snapshots.length), suffix: '', color: 'bg-white border-slate-200 text-slate-800' },
                    { label: 'Ventas Totales', value: fmt(totalSales), suffix: '', color: 'bg-white border-slate-200 text-slate-800' },
                    { label: 'Utilidad Neta Total', value: fmt(totalNet), suffix: '', color: totalNet >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600' },
                    { label: 'Margen Neto Promedio', value: `${avgMargin.toFixed(1)}%`, suffix: '', color: avgMargin >= 20 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700' },
                ].map(k => (
                    <div key={k.label} className={`p-5 rounded-2xl border shadow-sm text-center ${k.color}`}>
                        <p className="text-2xl font-black">{k.value}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mt-1">{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons-round text-slate-400 text-[18px]">table_rows</span>
                        Historial de Snapshots
                    </h2>
                    <button onClick={fetchSnapshots} className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                        <span className="material-icons-round text-[14px]">refresh</span>Actualizar
                    </button>
                </div>

                {loading && (
                    <div className="py-16 text-center text-slate-400">
                        <span className="material-icons-round text-4xl animate-spin block">refresh</span>
                    </div>
                )}
                {error && <div className="p-6 text-center text-red-500 font-bold">{error}</div>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-4 py-4 text-left">Fecha</th>
                                    <th className="px-4 py-4 text-left">Sucursal</th>
                                    <th className="px-4 py-4 text-right">Ventas</th>
                                    <th className="px-4 py-4 text-right">COGS</th>
                                    <th className="px-4 py-4 text-right">Gastos</th>
                                    <th className="px-4 py-4 text-right">Merma</th>
                                    <th className="px-4 py-4 text-right">Utilidad Bruta</th>
                                    <th className="px-4 py-4 text-right">Utilidad Neta</th>
                                    <th className="px-4 py-4 text-right">Val. Inventario</th>
                                    <th className="px-4 py-4 text-right">Margen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {snapshots.map(s => {
                                    const margin = s.totalSales > 0 ? (s.netProfit / s.totalSales) * 100 : 0;
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 font-black text-slate-800">
                                                {new Date(s.snapshotDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold">{s.branchName}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">{fmt(s.totalSales)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-slate-500">{fmt(s.totalCogs)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-slate-500">{fmt(s.totalExpenses)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-amber-600">{fmt(s.totalWasteCost)}</td>
                                            <td className="px-4 py-4 text-right"><ProfitBadge value={s.grossProfit} /></td>
                                            <td className="px-4 py-4 text-right"><ProfitBadge value={s.netProfit} /></td>
                                            <td className="px-4 py-4 text-right font-mono text-blue-600 font-bold">{fmt(s.inventoryValue)}</td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`text-xs font-black px-2 py-1 rounded-full ${margin >= 20 ? 'bg-emerald-100 text-emerald-700' : margin >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {snapshots.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-16 text-center text-slate-400">
                                            <span className="material-icons-round text-4xl block mb-2">assessment</span>
                                            <p className="font-bold">No hay snapshots todavía.</p>
                                            <p className="text-xs mt-1">Se generan automáticamente al cerrar una sesión de caja.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-icons-round text-blue-500 text-2xl flex-shrink-0">info</span>
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Cálculo de métricas</p>
                    <ul className="space-y-1 text-blue-700 list-disc list-inside">
                        <li><strong>Ventas:</strong> SUM(payments) de la sesión</li>
                        <li><strong>COGS:</strong> SUM(cost_at_sale × qty) de los ítems pagados</li>
                        <li><strong>Gastos:</strong> Gastos operativos del día (expenses.date)</li>
                        <li><strong>Merma:</strong> Mermas aprobadas del día × costo unitario</li>
                        <li><strong>Val. Inventario:</strong> Stock actual × costo por gramo al momento del cierre</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SnapshotHistoryView;
