
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface SaasSubscriptionsViewProps {
    currentUser: User | null;
}

const SaasSubscriptionsView: React.FC<SaasSubscriptionsViewProps> = ({ currentUser }) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [planId, setPlanId] = useState('');
    const [status, setStatus] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch plans
            const { data: plansData } = await supabase.from('subscription_plans').select('*').order('name');
            setPlans(plansData || []);

            // Fetch all restaurants
            const { data: restsData, error: restError } = await supabase
                .from('restaurants')
                .select('id, name, code')
                .order('name');
            if (restError) throw restError;

            // Fetch all active subscriptions with their plan details
            const { data: subsData, error: subError } = await supabase
                .from('restaurant_subscriptions')
                .select(`
                    id,
                    restaurant_id,
                    plan_id,
                    status,
                    starts_at,
                    ends_at,
                    subscription_plans (
                        name,
                        code
                    )
                `);
            if (subError) throw subError;

            // Map subscriptions to restaurants
            const mappedRestaurants = (restsData || []).map(rest => ({
                ...rest,
                restaurant_subscriptions: (subsData || []).filter(s => s.restaurant_id === rest.id)
            }));

            setRestaurants(mappedRestaurants);
        } catch (err) {
            console.error('Error fetching subscription data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (rest: any) => {
        const sub = rest.restaurant_subscriptions?.[0]; // Assume one active sub for simplicity
        setSelectedSub({ ...sub, restaurant_id: rest.id, restaurant_name: rest.name });
        setPlanId(sub?.plan_id || '');
        setStatus(sub?.status || 'active');
        setStartsAt(sub?.starts_at ? new Date(sub.starts_at).toISOString().split('T')[0] : '');
        setEndsAt(sub?.ends_at ? new Date(sub.ends_at).toISOString().split('T')[0] : '');
        setIsEditModalOpen(true);
    };

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;
        setIsSubmitting(true);

        try {
            const payload = {
                restaurant_id: selectedSub.restaurant_id,
                plan_id: planId,
                status: status,
                starts_at: startsAt || null,
                ends_at: endsAt || null
            };

            // Use upsert with restaurant_id as conflict target to prevent duplicate key errors
            const { error } = await supabase
                .from('restaurant_subscriptions')
                .upsert(payload, { onConflict: 'restaurant_id' });

            if (error) throw error;

            alert('✅ Suscripción actualizada correctamente');
            setIsEditModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Error updating subscription:', err);
            alert('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <span className="material-icons-round text-amber-600 text-2xl">card_membership</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Suscripciones</h1>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Panel de Control SaaS • Administra planes y accesos por restaurante.</p>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurante</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {restaurants.map(rest => {
                            const sub = rest.restaurant_subscriptions?.[0];
                            return (
                                <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-800">{rest.name}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">{rest.code || '---'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${sub ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                                            {sub?.subscription_plans?.name || 'SIN PLAN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sub?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {sub?.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                        {sub?.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Indefinido'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEditModal(rest)}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-lg"
                                        >
                                            <span className="material-icons-round text-lg">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Subscription Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gestionar Suscripción</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">{selectedSub?.restaurant_name}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubscription} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan de Suscripción</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer"
                                    value={planId}
                                    onChange={e => setPlanId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Seleccionar Plan</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    required
                                >
                                    <option value="active">Activo</option>
                                    <option value="trial">Prueba</option>
                                    <option value="suspended">Suspendido</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Inicia</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary"
                                        value={startsAt}
                                        onChange={e => setStartsAt(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Finaiza</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary"
                                        value={endsAt}
                                        onChange={e => setEndsAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary text-white hover:bg-primary/90 transition-all px-8 py-3 rounded-xl shadow-lg shadow-primary/20 font-bold text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Aplicar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaasSubscriptionsView;
