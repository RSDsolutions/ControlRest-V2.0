
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface SaasBranchesViewProps {
    currentUser: User | null;
}

interface Restaurant {
    id: string;
    name: string;
    created_at: string;
}

interface Branch {
    id: string;
    restaurant_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    is_main: boolean;
    created_at: string;
}

interface BranchFormData {
    name: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_main: boolean;
}

const EMPTY_FORM: BranchFormData = {
    name: '',
    address: '',
    phone: '',
    is_active: true,
    is_main: false,
};

const SaasBranchesView: React.FC<SaasBranchesViewProps> = ({ currentUser }) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loadingRest, setLoadingRest] = useState(true);

    // Drill-down state
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Modal / form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState<BranchFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Stats per branch
    const [branchStats, setBranchStats] = useState<Record<string, { users: number; tables: number }>>({});

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        setLoadingRest(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id, name, created_at')
                .order('name');
            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error('Error fetching restaurants:', err);
        } finally {
            setLoadingRest(false);
        }
    };

    const fetchBranches = async (restaurantId: string) => {
        setLoadingBranches(true);
        setBranchStats({});
        try {
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at');
            if (error) throw error;
            const list: Branch[] = data || [];
            setBranches(list);
            fetchBranchStats(restaurantId, list);
        } catch (err) {
            console.error('Error fetching branches:', err);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchBranchStats = async (restaurantId: string, branchList: Branch[]) => {
        try {
            const branchIds = branchList.map(b => b.id);
            if (branchIds.length === 0) return;

            const [{ data: userData }, { data: tableData }] = await Promise.all([
                supabase.from('users').select('branch_id').eq('restaurant_id', restaurantId),
                supabase.from('tables').select('branch_id').in('branch_id', branchIds),
            ]);

            const stats: Record<string, { users: number; tables: number }> = {};
            branchList.forEach(b => {
                stats[b.id] = {
                    users: userData?.filter(u => u.branch_id === b.id).length || 0,
                    tables: tableData?.filter(t => t.branch_id === b.id).length || 0,
                };
            });
            setBranchStats(stats);
        } catch (err) {
            console.error('Error fetching branch stats:', err);
        }
    };

    const openCreateModal = () => {
        setEditingBranch(null);
        setFormData(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address || '',
            phone: branch.phone || '',
            is_active: branch.is_active,
            is_main: branch.is_main,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant) return;
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                address: formData.address || null,
                phone: formData.phone || null,
                is_active: formData.is_active,
                is_main: formData.is_main,
                restaurant_id: selectedRestaurant.id,
            };

            if (editingBranch) {
                // If marking as main, clear others first
                if (formData.is_main) {
                    await supabase.from('branches')
                        .update({ is_main: false })
                        .eq('restaurant_id', selectedRestaurant.id);
                }
                const { error } = await supabase.from('branches').update(payload).eq('id', editingBranch.id);
                if (error) throw error;
            } else {
                // If marking as main, clear others first
                if (formData.is_main) {
                    await supabase.from('branches')
                        .update({ is_main: false })
                        .eq('restaurant_id', selectedRestaurant.id);
                }
                const { error } = await supabase.from('branches').insert(payload);
                if (error) throw error;
            }

            closeModal();
            fetchBranches(selectedRestaurant.id);
        } catch (err: any) {
            alert('Error: ' + (err.message || 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (branch: Branch) => {
        try {
            const { error } = await supabase.from('branches')
                .update({ is_active: !branch.is_active })
                .eq('id', branch.id);
            if (error) throw error;
            setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (branch: Branch) => {
        if (!confirm(`¿Eliminar la sucursal "${branch.name}"? Esta acción no se puede deshacer.`)) return;
        try {
            const { error } = await supabase.from('branches').delete().eq('id', branch.id);
            if (error) throw error;
            setBranches(prev => prev.filter(b => b.id !== branch.id));
        } catch (err: any) {
            alert('Error al eliminar: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleSelectRestaurant = (r: Restaurant) => {
        setSelectedRestaurant(r);
        setBranches([]);
        fetchBranches(r.id);
    };

    const handleBack = () => {
        setSelectedRestaurant(null);
        setBranches([]);
        setBranchStats({});
    };

    // ─── RESTAURANT LIST VIEW ─────────────────────────────────────────────────
    if (!selectedRestaurant) {
        return (
            <div className="p-8 space-y-8 animate-fade-in max-w-[1240px] mx-auto">
                <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-2xl text-violet-500">account_tree</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Sucursales</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Selecciona un restaurante para ver y administrar sus sucursales.</p>
                        </div>
                    </div>
                </header>

                {loadingRest ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 font-bold text-sm">
                        <span className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin mr-3"></span>
                        Cargando restaurantes...
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-300 font-bold text-sm">
                        No hay restaurantes registrados en la plataforma.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {restaurants.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleSelectRestaurant(r)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-violet-200 hover:scale-[1.02] transition-all duration-200 p-6 text-left group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                        <span className="material-icons-round text-violet-500 text-2xl">restaurant</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-violet-700 transition-colors">{r.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-mono">{r.id.slice(0, 16)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Desde {new Date(r.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'short' })}
                                    </span>
                                    <div className="flex items-center gap-1 text-violet-500 font-bold text-xs">
                                        Ver sucursales
                                        <span className="material-icons-round text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── BRANCHES VIEW ────────────────────────────────────────────────────────
    return (
        <>
            <div className="p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans">

                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-100 transition-all"
                            title="Volver a restaurantes"
                        >
                            <span className="material-icons-round">arrow_back</span>
                        </button>
                        <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-2xl text-violet-500">account_tree</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleBack} className="text-sm text-slate-400 hover:text-violet-600 transition-colors font-medium">
                                    Restaurantes
                                </button>
                                <span className="material-icons-round text-slate-300 text-sm">chevron_right</span>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedRestaurant.name}</h1>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">
                                {branches.length} sucursal{branches.length !== 1 ? 'es' : ''} registrada{branches.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn bg-violet-600 text-white hover:bg-violet-700 transition-all px-8 py-3 rounded-full shadow-lg shadow-violet-100 font-bold border border-violet-600 flex items-center gap-2"
                    >
                        <span className="material-icons-round text-[18px]">add</span>
                        Nueva Sucursal
                    </button>
                </header>

                {/* Branches Grid */}
                {loadingBranches ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 font-bold text-sm">
                        <span className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin mr-3"></span>
                        Cargando sucursales...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {branches.map(branch => {
                            const stats = branchStats[branch.id] || { users: 0, tables: 0 };
                            return (
                                <div key={branch.id} className="card p-8 group relative overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-slate-100 bg-white rounded-2xl border">
                                    {/* Top Row */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
                                            <span className="material-icons-round text-2xl">store</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${branch.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                {branch.is_active ? '● Operativa' : '○ Inactiva'}
                                            </span>
                                            {branch.is_main && (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    Matriz Principal
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-icons-round text-sm">location_on</span>
                                                <p className="text-xs font-medium">{branch.address || 'Sin dirección'}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 mt-1">
                                                <span className="material-icons-round text-sm">phone</span>
                                                <p className="text-xs font-medium">{branch.phone || 'Sin teléfono'}</p>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personal</p>
                                                <p className="text-2xl font-bold text-slate-900">{stats.users}</p>
                                            </div>
                                            <div className="border-l border-slate-100 pl-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesas</p>
                                                <p className="text-2xl font-bold text-slate-900">{stats.tables}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => openEditModal(branch)}
                                            className="flex-1 btn btn-outline py-2.5 text-xs group/btn border border-slate-200 rounded-xl hover:border-violet-300 hover:text-violet-600 transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="material-icons-round text-sm transition-transform group-hover/btn:rotate-12">edit</span>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(branch)}
                                            className={`w-11 h-10 rounded-xl flex items-center justify-center border transition-all ${branch.is_active
                                                ? 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-500 hover:text-white'
                                                : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                            title={branch.is_active ? 'Desactivar' : 'Activar'}
                                        >
                                            <span className="material-icons-round text-lg">{branch.is_active ? 'pause_circle' : 'play_circle'}</span>
                                        </button>
                                        {!branch.is_main && (
                                            <button
                                                onClick={() => handleDelete(branch)}
                                                className="w-11 h-10 rounded-xl flex items-center justify-center border bg-rose-50 border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                                title="Eliminar Sucursal"
                                            >
                                                <span className="material-icons-round text-lg">delete_outline</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Background decoration */}
                                    <div className="absolute -right-2 -bottom-2 opacity-[0.04] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                                        <span className="material-icons-round text-9xl">store</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add new card */}
                        <button
                            onClick={openCreateModal}
                            className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-violet-300 hover:bg-white transition-all group min-h-[300px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-violet-500 transition-colors shadow-sm">
                                <span className="material-icons-round text-3xl">add</span>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Añadir Sucursal</p>
                        </button>
                    </div>
                )}
            </div>

            {/* ─── MODAL ─────────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                                    {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.05em] mt-2.5">
                                    {selectedRestaurant.name}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors border border-slate-100"
                            >
                                <span className="material-icons-round text-2xl">close</span>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-700">Nombre de Sucursal</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-300 transition-all outline-none font-bold text-slate-700"
                                            placeholder="Ej: Sucursal Norte"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-700">Teléfono</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-300 transition-all outline-none font-bold text-slate-700"
                                            placeholder="Ej: 0987654321"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    {/* Address */}
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[13px] font-bold text-slate-700">Dirección Física</label>
                                        <textarea
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-300 transition-all outline-none font-bold text-slate-700 min-h-[80px] resize-none"
                                            placeholder="Dirección exacta..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${formData.is_active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <span className="material-icons-round">{formData.is_active ? 'check' : 'power_settings_new'}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Sucursal Activa</p>
                                            <p className="text-[10px] text-slate-400">{formData.is_active ? 'Operativa' : 'Fuera de línea'}</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${formData.is_main ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}
                                        onClick={() => setFormData({ ...formData, is_main: !formData.is_main })}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_main ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <span className="material-icons-round">stars</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Matriz Principal</p>
                                            <p className="text-[10px] text-slate-400">Sede central del restaurante</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn bg-violet-600 text-white hover:bg-violet-700 transition-all px-10 py-3 rounded-full shadow-lg shadow-violet-100 font-bold border border-violet-600 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : (editingBranch ? 'Actualizar Sucursal' : 'Crear Sucursal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SaasBranchesView;
