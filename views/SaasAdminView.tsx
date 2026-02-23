
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, Restaurant } from '../types';

interface SaasAdminViewProps {
    currentUser: User | null;
    onImpersonate: (restaurantId: string) => void;
}

const SaasAdminView: React.FC<SaasAdminViewProps> = ({ currentUser, onImpersonate }) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            // Fetch restaurants and count users
            const { data, error } = await supabase
                .from('restaurants')
                .select(`
                    *,
                    users:users(count)
                `);

            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error('Error fetching restaurants:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRestaurantStatus = async (id: string, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const { error } = await supabase
                .from('restaurants')
                .update({ subscription_status: nextStatus })
                .eq('id', id);
            if (error) throw error;
            fetchRestaurants();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-primary">admin_panel_settings</span>
                        Panel Global SaaS
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Administración de restaurantes y soporte global.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-50 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                        Superadmin Mode
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Restaurantes</p>
                    <h3 className="text-3xl font-black text-slate-900">{restaurants.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Activos</p>
                    <h3 className="text-3xl font-black text-emerald-500">{restaurants.filter(r => r.subscription_status === 'active').length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Usuarios Totales</p>
                    <h3 className="text-3xl font-black text-blue-500">
                        {restaurants.reduce((acc, r) => acc + (r.users?.[0]?.count || 0), 0)}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurante</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuarios</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creado el</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {restaurants.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{r.name}</div>
                                    <div className="text-xs text-slate-400">{r.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${r.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {r.subscription_status === 'active' ? 'Activo' : 'Suspendido'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-600">
                                    {r.users?.[0]?.count || 0}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onImpersonate(r.id)}
                                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-icons-round text-sm">support_agent</span>
                                            Soporte
                                        </button>
                                        <button
                                            onClick={() => toggleRestaurantStatus(r.id, r.subscription_status)}
                                            className={`p-2 rounded-lg transition-all ${r.subscription_status === 'active' ? 'text-red-400 hover:bg-red-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                                        >
                                            <span className="material-icons-round">{r.subscription_status === 'active' ? 'block' : 'check_circle'}</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SaasAdminView;
