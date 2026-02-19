import React, { useState, useEffect } from 'react';
import { Ingredient, User } from '../types';
import { supabase } from '../supabaseClient';

interface KitchenWasteViewProps {
    ingredients: Ingredient[];
    user: User;
    branchId: string | null;
    restaurantId: string | null;
}

const KitchenWasteView: React.FC<KitchenWasteViewProps> = ({ ingredients, user, branchId, restaurantId }) => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedIngId, setSelectedIngId] = useState('');
    const [qty, setQty] = useState(100);
    const [reason, setReason] = useState('');

    const fetchMyReports = async () => {
        if (!user.id) return;
        const { data, error } = await supabase
            .from('waste_reports')
            .select('*, ingredients(name, icon, unit_base)')
            .eq('reported_by', user.id)
            .order('created_at', { ascending: false });

        if (data) setReports(data);
    };

    useEffect(() => {
        fetchMyReports();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIngId || !qty || !branchId || !restaurantId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('submit_waste_report', {
                p_ingredient_id: selectedIngId,
                p_quantity_grams: qty,
                p_reason: reason
            });

            if (error) {
                console.error('RPC Error:', error);
                throw new Error(error.message);
            }

            alert('Reporte enviado exitosamente para aprobación.');
            setSelectedIngId('');
            setQty(100);
            setReason('');
            setShowForm(false);
            fetchMyReports();
        } catch (err: any) {
            console.error('Submission Error:', err);
            alert('Error al enviar reporte: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fadeIn max-w-[1000px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reportar Merma</h1>
                    <p className="text-slate-500 mt-1">Notifica desperdicios para aprobación de administración.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                >
                    <span className="material-icons-round">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Reporte'}
                </button>
            </header>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border-2 border-primary/10 shadow-xl animate-scaleUp space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingrediente Dañado/Excedente</label>
                            <select
                                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary transition-all font-bold"
                                value={selectedIngId}
                                onChange={(e) => setSelectedIngId(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.icon} {ing.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad Aproximada (Gramos/ml)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary transition-all font-black"
                                    value={qty}
                                    onChange={(e) => setQty(parseFloat(e.target.value))}
                                    required
                                />
                                <span className="absolute right-4 top-4 text-slate-400 font-bold">gr/ml</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo o Explicación</label>
                            <textarea
                                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary transition-all text-sm italic"
                                rows={3}
                                placeholder="Ej: Se quemó durante la producción, llegó vencido, error en corte..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-10 py-4 bg-primary text-white rounded-[20px] font-black text-sm uppercase shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Reporte a Admin'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800">Mis Reportes Recientes</h3>
                <div className="grid gap-3">
                    {reports.map(r => (
                        <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">
                                    {r.ingredients?.icon || '📦'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900">{r.ingredients?.name}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${r.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium italic">{r.reason}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800">{r.quantity_grams}{r.ingredients?.unit_base || 'gr'}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && (
                        <div className="bg-white py-12 text-center rounded-[32px] border border-dashed border-slate-200 text-slate-400 font-bold">
                            Aún no has enviado reportes de merma.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KitchenWasteView;
