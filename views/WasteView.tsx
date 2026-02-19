import React, { useState, useEffect, useMemo } from 'react';
import { Ingredient, User, WasteRecord } from '../types';
import { supabase } from '../supabaseClient';

interface WasteViewProps {
    ingredients: Ingredient[];
    currentUser: any;
    restaurantId: string;
    branchId: string | 'GLOBAL';
    branches?: any[];
}

const WASTE_REASONS = ['damaged', 'expired', 'kitchen_error', 'adjustment', 'other'];

const WasteView: React.FC<WasteViewProps> = ({ ingredients, currentUser, restaurantId, branchId, branches = [] }) => {
    const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
    const [pendingReports, setPendingReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'pending'>('history');

    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState<WasteRecord['reason']>('expired');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch data
    useEffect(() => {
        fetchWasteRecords();
        if (currentUser?.role === 'admin') fetchPendingReports();
    }, [branchId, branches]);

    const fetchWasteRecords = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('waste_records')
                .select(`
                  *,
                  users ( full_name ),
                  ingredients ( name, unit_base )
                `);

            if (branchId === 'GLOBAL') {
                const branchIds = branches.map(b => b.id);
                if (branchIds.length > 0) query = query.in('branch_id', branchIds);
                else { setWasteRecords([]); setLoading(false); return; }
            } else {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
            if (error) throw error;
            if (data) {
                setWasteRecords(data.map((d: any) => ({
                    ...d,
                    ingredientId: d.ingredient_id,
                    branchId: d.branch_id,
                    userId: d.user_id,
                    totalCost: d.total_cost || 0,
                    unit: d.ingredients?.unit_base || 'N/A',
                    userName: d.users?.full_name || 'Desconocido',
                    ingredientName: d.ingredients?.name || 'Desconocido'
                })));
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchPendingReports = async () => {
        try {
            let query = supabase.from('waste_reports').select('*, ingredients(name, icon, unit_base), users:reported_by(full_name)').eq('status', 'pending');

            if (branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            } else {
                const branchIds = branches.map(b => b.id);
                if (branchIds.length > 0) query = query.in('branch_id', branchIds);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setPendingReports(data);
        } catch (error) { console.error(error); }
    };

    const handleApproveReport = async (reportId: string) => {
        if (!confirm('¿Confirmas la aprobación de esta merma? El stock se descontará automáticamente.')) return;

        try {
            const { error } = await supabase.rpc('approve_waste_report', { p_report_id: reportId });
            if (error) throw error;
            alert('Reporte aprobado exitosamente.');
            fetchPendingReports();
            fetchWasteRecords();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleRejectReport = async (reportId: string) => {
        if (!confirm('¿Deseas rechazar este reporte?')) return;
        try {
            const { error } = await supabase.from('waste_reports').update({ status: 'rejected' }).eq('id', reportId);
            if (error) throw error;
            fetchPendingReports();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const activeIngredients = useMemo(() => (Array.isArray(ingredients) ? ingredients : []).filter(i => i.currentQty > 0), [ingredients]);
    const selectedIngredient = useMemo(() => (Array.isArray(ingredients) ? ingredients : []).find(i => i.id === selectedIngredientId), [ingredients, selectedIngredientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIngredientId || quantity <= 0) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.rpc('register_waste_atomic', {
                p_ingredient_id: selectedIngredientId,
                p_quantity: quantity,
                p_reason: reason,
                p_notes: notes,
                p_user_id: currentUser?.id,
                p_branch_id: branchId === 'GLOBAL' ? branches[0]?.id : branchId
            });
            if (error) throw error;
            alert('Merma registrada exitosamente.');
            setQuantity(0); setNotes(''); setSelectedIngredientId('');
            fetchWasteRecords();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally { setIsSubmitting(false); }
    };

    const getReasonLabel = (r: string) => {
        const map: any = { 'damaged': 'Dañado', 'expired': 'Vencido', 'kitchen_error': 'Error Cocina', 'adjustment': 'Ajuste', 'other': 'Otro' };
        return map[r] || r;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fadeIn pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <span className="material-icons-round text-red-500 text-4xl">delete_forever</span>
                        Control de Mermas
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión administrativa de desperdicios.</p>
                </div>
                {currentUser?.role === 'admin' && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button onClick={() => setActiveTab('history')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}>HISTORIAL</button>
                        <button onClick={() => setActiveTab('pending')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}>
                            PENDIENTES
                            {pendingReports.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] animate-pulse">{pendingReports.length}</span>}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {activeTab === 'history' && branchId !== 'GLOBAL' && (
                    <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 h-fit">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-slate-400">add_circle</span>
                            Registrar Nueva Merma (Directo)
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ingrediente</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} required>
                                    <option value="">Selecciona...</option>
                                    {activeIngredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.currentQty} {ing.measureUnit})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" step="0.01" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="Cantidad" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value))} required />
                                <input disabled className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-100 text-slate-500 font-bold" value={selectedIngredient?.measureUnit || '-'} />
                            </div>
                            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" value={reason} onChange={(e: any) => setReason(e.target.value)}>
                                {WASTE_REASONS.map(r => <option key={r} value={r}>{getReasonLabel(r)}</option>)}
                            </select>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 min-h-[100px]" placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)} />
                            <button type="submit" disabled={isSubmitting || quantity <= 0} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                {isSubmitting ? 'Registrando...' : 'Registrar Merma'}
                            </button>
                        </form>
                    </section>
                )}

                <section className={`${activeTab === 'pending' || branchId === 'GLOBAL' ? "lg:col-span-3" : "lg:col-span-2"} bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col h-[700px]`}>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-slate-400">{activeTab === 'history' ? 'history' : 'pending_actions'}</span>
                        {activeTab === 'history' ? 'Historial de Mermas' : 'Reportes de Cocina Pendientes'}
                    </h2>

                    <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
                        {activeTab === 'history' ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr className="text-xs font-bold text-slate-500 uppercase">
                                        <th className="p-4">Fecha</th>
                                        {branchId === 'GLOBAL' && <th className="p-4">Sucursal</th>}
                                        <th className="p-4">Ingrediente</th>
                                        <th className="p-4">Cantidad</th>
                                        <th className="p-4">Pérdida ($)</th>
                                        <th className="p-4">Motivo</th>
                                        <th className="p-4">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {wasteRecords.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-xs text-slate-500">{new Date(record.created_at).toLocaleString()}</td>
                                            {branchId === 'GLOBAL' && <td className="p-4 text-xs font-bold">{branches?.find(b => b.id === record.branchId)?.name}</td>}
                                            <td className="p-4 font-bold text-slate-700">
                                                {record.ingredientName}
                                                {record.notes && <div className="text-[10px] text-slate-400 font-normal italic">"{record.notes}"</div>}
                                            </td>
                                            <td className="p-4 text-sm">{record.quantity} {record.unit}</td>
                                            <td className="p-4 font-bold text-red-500">${record.totalCost.toFixed(2)}</td>
                                            <td className="p-4 text-xs"><span className="px-2 py-1 bg-slate-100 rounded-lg">{getReasonLabel(record.reason)}</span></td>
                                            <td className="p-4 text-xs text-slate-400">{record.userName}</td>
                                        </tr>
                                    ))}
                                    {wasteRecords.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-400">No hay registros de merma.</td></tr>}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                {pendingReports.map(report => (
                                    <div key={report.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="text-3xl">{report.ingredients?.icon || '📦'}</div>
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase tracking-tight">{report.ingredients?.name || 'Desconocido'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{branches.find(b => b.id === report.branch_id)?.name || 'Sucursal desconocida'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs font-bold text-slate-500">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs text-slate-400 font-bold uppercase">Reportado por</span>
                                                <span className="text-xs font-black text-slate-700">{report.users?.full_name || 'Desconocido'}</span>
                                            </div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs text-slate-400 font-bold uppercase">Cantidad</span>
                                                <span className="text-sm font-black text-red-600">{report.quantity_grams}{report.ingredients?.unit_base || ''}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-50">
                                                <p className="text-xs text-slate-500 italic">"{report.reason || 'Sin motivo'}"</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => handleApproveReport(report.id)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">APROBAR</button>
                                            <button onClick={() => handleRejectReport(report.id)} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl text-xs uppercase transition-all">RECHAZAR</button>
                                        </div>
                                    </div>
                                ))}
                                {pendingReports.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-bold">No hay reportes de cocina pendientes.</div>}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default WasteView;
