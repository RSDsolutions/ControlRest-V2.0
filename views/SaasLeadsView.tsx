import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Lead {
    id: string;
    restaurant_name: string;
    contact_name: string;
    email: string;
    phone: string;
    city: string;
    number_of_branches: string;
    monthly_sales_range: string;
    current_control_method: string;
    has_inventory_control: boolean;
    has_recipe_costing: boolean;
    uses_pos: boolean;
    main_problem: string;
    requested_plan_interest: string;
    status: 'pending' | 'contacted' | 'demo_scheduled' | 'closed' | 'lost';
    created_at: string;
    score: number;
    contact_date: string | null;
    notes: string | null;
}

const SaasLeadsView: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

    // Computed Metrics
    const metrics = {
        totalThisMonth: leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length,
        contactRate: leads.length ? Math.round((leads.filter(l => l.status !== 'pending').length / leads.length) * 100) : 0,
        closeRate: leads.length ? Math.round((leads.filter(l => l.status === 'closed').length / leads.length) * 100) : 0,
        cities: Array.from(new Set(leads.map(l => l.city))),
        totalLeads: leads.length
    };

    const fetchLeads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('demo_requests')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleStatusChange = async (id: string, currentLead: Lead, newStatus: Lead['status']) => {
        const isContacting = newStatus === 'contacted' && !currentLead.contact_date;
        const updates: Partial<Lead> = { status: newStatus };
        if (isContacting) {
            updates.contact_date = new Date().toISOString();
        }

        // Optimistic UI
        setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        if (selectedLead?.id === id) {
            setSelectedLead({ ...selectedLead, ...updates });
        }

        await supabase.from('demo_requests').update(updates).eq('id', id);
    };

    const handleSaveNotes = async (id: string, notes: string) => {
        // Optimistic UI
        setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
        await supabase.from('demo_requests').update({ notes }).eq('id', id);
    };

    const filteredLeads = leads.filter(lead => {
        if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
        if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
        if (lead.score < minScoreFilter) return false;
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">NUEVO</span>;
            case 'contacted': return <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">CONTACTADO</span>;
            case 'demo_scheduled': return <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">AGENDADO</span>;
            case 'closed': return <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold border border-green-200">CERRADO</span>;
            case 'lost': return <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold border border-red-200">PERDIDO</span>;
            default: return null;
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-blue-600 text-4xl">group_add</span>
                        Leads (CRM)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Gestión de prospectos comerciales y demos solicitadas.</p>
                </div>
            </div>

            {/* Metrics Dash */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Leads Mes</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{metrics.totalThisMonth}</p>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tasa de Contacto</p>
                    <p className="text-3xl font-black text-blue-600 mt-1">{metrics.contactRate}%</p>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tasa de Cierre</p>
                    <p className="text-3xl font-black text-green-600 mt-1">{metrics.closeRate}%</p>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Top Ciudad</p>
                    <p className="text-3xl font-black text-purple-600 mt-1">{metrics.cities[0] || 'N/A'}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white border border-slate-200 shadow-sm p-4 rounded-xl items-center">
                <span className="material-icons-round text-slate-400">filter_list</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2 cursor-pointer outline-none focus:border-blue-500 transition-colors">
                    <option value="all">Todos los Estados</option>
                    <option value="pending">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="demo_scheduled">Agendado</option>
                    <option value="closed">Cerrado</option>
                    <option value="lost">Perdido</option>
                </select>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="bg-white text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2 cursor-pointer outline-none focus:border-blue-500 transition-colors">
                    <option value="all">Todas las Ciudades</option>
                    {metrics.cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-sm">Score Mín:</span>
                    <input type="number" value={minScoreFilter} onChange={e => setMinScoreFilter(parseInt(e.target.value) || 0)} className="bg-transparent text-slate-900 w-12 text-sm outline-none" min="0" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Cargando leads...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Restaurante / Contacto</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ciudad</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sucursales</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeads.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-500 italic">No se encontraron prospectos.</td></tr>
                                ) : filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-round text-amber-500 text-lg">local_fire_department</span>
                                                <span className="text-slate-900 font-black text-lg">{lead.score}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
                                            <span className="block text-xs text-slate-400">{format(new Date(lead.created_at), "HH:mm")}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{lead.restaurant_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{lead.contact_name}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">{lead.city}</td>
                                        <td className="p-4 text-sm text-slate-600">{lead.number_of_branches}</td>
                                        <td className="p-4">{getStatusBadge(lead.status)}</td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors group-hover:scale-110 active:scale-95">
                                                <span className="material-icons-round text-sm">open_in_new</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLead(null)}>
                    <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-slate-900">{selectedLead.restaurant_name}</h2>
                                    {getStatusBadge(selectedLead.status)}
                                </div>
                                <p className="text-slate-500 text-sm mt-1">Solicitado el {format(new Date(selectedLead.created_at), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Column 1: Lead Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                            <span className="w-6 h-px bg-blue-600/30"></span> Datos Contacto
                                        </h3>
                                        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="w-24 font-bold text-slate-500">Nombre:</span> {selectedLead.contact_name}</div>
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="w-24 font-bold text-slate-500">Email:</span> <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">{selectedLead.email}</a></div>
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="w-24 font-bold text-slate-500">Teléfono:</span> <a href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">{selectedLead.phone}</a></div>
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="w-24 font-bold text-slate-500">Ciudad:</span> {selectedLead.city}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                            <span className="w-6 h-px bg-blue-600/30"></span> Perfil Operativo
                                        </h3>
                                        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="font-bold text-slate-500 w-32">Sucursales:</span> {selectedLead.number_of_branches}</div>
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="font-bold text-slate-500 w-32">Ventas/mes:</span> {selectedLead.monthly_sales_range}</div>
                                            <div className="flex gap-2 text-sm text-slate-700"><span className="font-bold text-slate-500 w-32">Método Actual:</span> {selectedLead.current_control_method}</div>
                                            <div className="flex gap-2 text-sm text-slate-700 mt-2 pt-2 border-t border-slate-200">
                                                <div className="flex items-center gap-1">{selectedLead.has_inventory_control ? '✅' : '❌'} Inventario</div>
                                                <div className="flex items-center gap-1">{selectedLead.has_recipe_costing ? '✅' : '❌'} Recetas</div>
                                                <div className="flex items-center gap-1">{selectedLead.uses_pos ? '✅' : '❌'} POS</div>
                                            </div>
                                            <div className="flex gap-2 text-sm text-slate-700 mt-2 pt-2 border-t border-slate-200"><span className="font-bold text-slate-500 w-32">Plan interés:</span> {selectedLead.requested_plan_interest}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                            <span className="w-6 h-px bg-blue-600/30"></span> Problema Principal
                                        </h3>
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-700 italic whitespace-pre-wrap">
                                            {selectedLead.main_problem}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: CRM Tools */}
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-1">Score del Lead</p>
                                            <p className="text-4xl font-black text-slate-900">{selectedLead.score} <span className="text-lg text-slate-500 font-medium">pts</span></p>
                                        </div>
                                        <span className="material-icons-round text-5xl text-blue-200">analytics</span>
                                    </div>

                                    <div>
                                        <h3 className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                            <span className="w-6 h-px bg-blue-600/30"></span> Gestión Comercial
                                        </h3>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <button onClick={() => handleStatusChange(selectedLead.id, selectedLead, 'contacted')} className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${selectedLead.status === 'contacted' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                <span className="material-icons-round text-sm">phone_in_talk</span> Contactado
                                            </button>
                                            <button onClick={() => handleStatusChange(selectedLead.id, selectedLead, 'demo_scheduled')} className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${selectedLead.status === 'demo_scheduled' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                <span className="material-icons-round text-sm">event</span> Agendado
                                            </button>
                                            <button onClick={() => handleStatusChange(selectedLead.id, selectedLead, 'closed')} className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${selectedLead.status === 'closed' ? 'bg-green-600 text-white shadow-md shadow-green-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                <span className="material-icons-round text-sm">monetization_on</span> Cerrado
                                            </button>
                                            <button onClick={() => handleStatusChange(selectedLead.id, selectedLead, 'lost')} className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${selectedLead.status === 'lost' ? 'bg-red-600 text-white shadow-md shadow-red-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                <span className="material-icons-round text-sm">thumb_down</span> Perdido
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-slate-500 text-xs font-bold uppercase">Notas Internas</label>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:border-blue-500 focus:bg-white outline-none resize-none h-32 transition-colors"
                                                placeholder="Bitácora de seguimiento, próximas acciones..."
                                                defaultValue={selectedLead.notes || ''}
                                                onBlur={(e) => handleSaveNotes(selectedLead.id, e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaasLeadsView;
