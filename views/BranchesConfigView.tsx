
import React, { useState, useEffect } from 'react';
import { User, Branch } from '../types';
import { supabase } from '../supabaseClient';
import { logActivity } from '../services/audit';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';
import PlanUpgradeFullPage from '../components/PlanUpgradeFullPage';

interface BranchesConfigViewProps {
    currentUser: User | null;
    branches: Branch[];
    setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const BranchesConfigView: React.FC<BranchesConfigViewProps> = ({ currentUser, branches, setBranches }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        isActive: true,
        isMain: false
    });

    const [branchStats, setBranchStats] = useState<Record<string, { users: number; tables: number }>>({});

    const { data: planData } = usePlanFeatures(currentUser?.restaurantId);
    const canManageBranches = isFeatureEnabled(planData, 'ENABLE_AUDIT_LOGS');
    const isPlan3 = planData?.planCode === 'PLAN_MULTIPRODUCTIVO';

    useEffect(() => {
        fetchBranchStats();
    }, [branches]);

    const fetchBranchStats = async () => {
        if (!currentUser?.restaurantId) return;

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('branch_id')
                .eq('restaurant_id', currentUser.restaurantId);

            const { data: tableData } = await supabase
                .from('tables')
                .select('branch_id');

            const stats: Record<string, { users: number; tables: number }> = {};

            branches.forEach(b => {
                stats[b.id] = {
                    users: userData?.filter(u => u.branch_id === b.id).length || 0,
                    tables: tableData?.filter(t => t.branch_id === b.id).length || 0
                };
            });

            setBranchStats(stats);
        } catch (err) {
            console.error('Error fetching branch stats:', err);
        }
    };

    const openModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                isActive: branch.isActive,
                isMain: branch.isMain
            });
        } else {
            setEditingBranch(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                isActive: true,
                isMain: false
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.restaurantId) return;
        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                is_active: formData.isActive,
                is_main: formData.isMain,
                restaurant_id: currentUser.restaurantId
            };

            if (editingBranch) {
                // If making this one main, we need to ensure others are not main? 
                // Usually handled by DB trigger or logic. Let's assume logic here for safety.
                if (formData.isMain) {
                    await supabase.from('branches')
                        .update({ is_main: false })
                        .eq('restaurant_id', currentUser.restaurantId);
                }

                const { error } = await supabase.from('branches').update(payload).eq('id', editingBranch.id);
                if (error) throw error;

                setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...formData } : (formData.isMain ? { ...b, isMain: false } : b)));
                await logActivity(currentUser.id, 'edit_branch', 'BranchesConfig', { id: editingBranch.id, name: formData.name });
            } else {
                if (formData.isMain) {
                    await supabase.from('branches')
                        .update({ is_main: false })
                        .eq('restaurant_id', currentUser.restaurantId);
                }

                const { data, error } = await supabase.from('branches').insert(payload).select().single();
                if (error) throw error;

                if (data) {
                    const newBranch: Branch = {
                        id: data.id,
                        restaurantId: data.restaurant_id,
                        name: data.name,
                        address: data.address,
                        phone: data.phone,
                        isActive: data.is_active,
                        isMain: data.is_main
                    };
                    setBranches(prev => [...prev.map(b => formData.isMain ? { ...b, isMain: false } : b), newBranch]);
                }
                await logActivity(currentUser.id, 'create_branch', 'BranchesConfig', { name: formData.name });
            }

            closeModal();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (branch: Branch) => {
        try {
            const newStatus = !branch.isActive;
            const { error } = await supabase.from('branches').update({ is_active: newStatus }).eq('id', branch.id);
            if (error) throw error;
            setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, isActive: newStatus } : b));
            await logActivity(currentUser?.id || '', 'toggle_branch_status', 'BranchesConfig', { id: branch.id, status: newStatus });
        } catch (err) {
            console.error(err);
        }
    };

    if (!canManageBranches) {
        return <PlanUpgradeFullPage featureName="Gestión Multi-Sucursal" description="La expansión de sucursales y la gestión centralizada de múltiples sedes están reservadas para el plan PRO. Haz crecer tu negocio con nuestra infraestructura escalable." />;
    }

    return (
        <>
            <div className="p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                            <span className="material-icons-round text-2xl">storefront</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración de Sucursales</h1>
                            <p className="text-sm text-slate-500 font-medium">RESTOGESTIÓN V2.0 • Gestiona las ubicaciones físicas de tu negocio y sus estados.</p>
                        </div>
                    </div>
                    {!isPlan3 && (
                        <button
                            onClick={() => openModal()}
                            className="btn bg-primary text-white hover:bg-primary-dark transition-all px-8 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-primary flex items-center gap-2"
                        >
                            <span className="material-icons-round text-[18px]">add</span> Nueva Sucursal
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {branches.map(branch => {
                        const stats = branchStats[branch.id] || { users: 0, tables: 0 };
                        return (
                            <div key={branch.id} className="card p-8 group relative overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-slate-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <span className="material-icons-round text-2xl">store</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${branch.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {branch.isActive ? '● Operativa' : '○ Inactiva'}
                                        </span>
                                        {branch.isMain && (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                Matriz Principal
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.name}</h3>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="material-icons-round text-sm">location_on</span>
                                            <p className="text-xs font-medium">{branch.address}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                                            <span className="material-icons-round text-sm">phone</span>
                                            <p className="text-xs font-medium">{branch.phone || 'Sin teléfono'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personal</p>
                                            <p className="text-2xl font-bold text-slate-900">{stats.users}</p>
                                        </div>
                                        <div className="text-center md:text-left border-l border-slate-100 pl-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesas</p>
                                            <p className="text-2xl font-bold text-slate-900">{stats.tables}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    {!isPlan3 && (
                                        <>
                                            <button
                                                onClick={() => openModal(branch)}
                                                className="flex-1 btn btn-outline py-2.5 text-xs group/btn"
                                            >
                                                <span className="material-icons-round text-sm mr-2 transition-transform group-hover/btn:rotate-12">edit</span>
                                                Editar Perfil
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(branch)}
                                                className={`w-12 h-10 rounded-xl flex items-center justify-center border transition-all ${branch.isActive ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                                title={branch.isActive ? 'Desactivar Sucursal' : 'Activar Sucursal'}
                                            >
                                                <span className="material-icons-round text-xl">{branch.isActive ? 'block' : 'check_circle'}</span>
                                            </button>
                                        </>
                                    )}
                                    {isPlan3 && (
                                        <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración Bloqueada</p>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <span className="material-icons-round text-9xl">store</span>
                                </div>
                            </div>
                        );
                    })}

                    {!isPlan3 && (
                        <button
                            onClick={() => openModal()}
                            className="card p-8 border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-primary/30 hover:bg-white transition-all group min-h-[300px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors shadow-sm">
                                <span className="material-icons-round text-3xl">add</span>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Añadir Sucursal</p>
                        </button>
                    )}
                </div>

                <footer className="pt-12 pb-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    RESTOGESTIÓN V2.0 © 2024 - GESTIÓN DE INFRAESTRUCTURA MULTISEDE
                </footer>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                                    {editingBranch ? 'Actualizar Sucursal' : 'Nueva Sucursal'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.05em] mt-2.5">INFRAESTRUCTURA OPERATIVA</p>
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
                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-slate-700">Nombre de Sucursal</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700"
                                            placeholder="Ej: Sucursal Norte"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-slate-700">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700"
                                            placeholder="Ej: 0987654321"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-full space-y-3">
                                        <label className="text-[13px] font-bold text-slate-700">Dirección Física</label>
                                        <textarea
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700 min-h-[100px]"
                                            placeholder="Dirección exacta..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${formData.isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                <span className="material-icons-round">{formData.isActive ? 'check' : 'power_settings_new'}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Sucursal Activa</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{formData.isActive ? 'Operativa' : 'Fuera de línea'}</p>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${formData.isMain ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}
                                            onClick={() => setFormData({ ...formData, isMain: !formData.isMain })}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isMain ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                <span className="material-icons-round">stars</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Matriz Principal</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Sede central</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Confirmar Sucursal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default BranchesConfigView;
