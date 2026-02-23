
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole } from '../types';

interface SaasManagementViewProps {
    currentUser: User | null;
}

const SaasManagementView: React.FC<SaasManagementViewProps> = ({ currentUser }) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditRestModalOpen, setIsEditRestModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
    const [restaurantUsers, setRestaurantUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Restaurant Form states
    const [restName, setRestName] = useState('');
    const [restRuc, setRestRuc] = useState('');

    // Admin Creation states (for NEW restaurant)
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPass, setAdminPass] = useState('');

    // Employee states (for EXISTING restaurant)
    const [empName, setEmpName] = useState('');
    const [empEmail, setEmpEmail] = useState('');
    const [empPass, setEmpPass] = useState('');
    const [empRole, setEmpRole] = useState<UserRole>(UserRole.WAITER);
    const [empBranchId, setEmpBranchId] = useState('');

    // Editing User states
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editEmpName, setEditEmpName] = useState('');
    const [editEmpEmail, setEditEmpEmail] = useState('');
    const [editEmpUsername, setEditEmpUsername] = useState('');
    const [editEmpPass, setEditEmpPass] = useState('');
    const [editEmpRole, setEditEmpRole] = useState<UserRole>(UserRole.WAITER);
    const [editEmpBranchId, setEditEmpBranchId] = useState('');

    // Corporate Data states
    const [businessName, setBusinessName] = useState('');
    const [legalRep, setLegalRep] = useState('');
    const [phone, setPhone] = useState('');
    const [corpEmail, setCorpEmail] = useState('');
    const [mainAddress, setMainAddress] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRestaurants();
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const { data, error } = await supabase
                .from('branches')
                .select('*');
            if (error) throw error;
            setBranches(data || []);
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    };

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('saas_get_restaurants_with_counts');
            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error('Error fetching restaurants:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurantUsers = async (restaurantId: string) => {
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, branches(name)')
                .eq('restaurant_id', restaurantId);
            if (error) throw error;
            setRestaurantUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Create Restaurant
            const { data: restId, error: restError } = await supabase.rpc('saas_create_restaurant', {
                p_name: restName
            });
            if (restError) throw restError;

            // 2. Create Admin User
            const { data: userData, error: userError } = await supabase.rpc('saas_create_user', {
                p_email: adminEmail,
                p_password: adminPass,
                p_full_name: adminName,
                p_role: 'admin',
                p_restaurant_id: restId
            });
            if (userError) throw userError;

            // NEW: Check for internal business logic success
            if (userData && userData.success === false) {
                throw new Error(userData.message || 'Error al crear el usuario administrador');
            }

            setIsCreateModalOpen(false);
            setRestName('');
            setAdminName('');
            setAdminEmail('');
            setAdminPass('');
            fetchRestaurants();
        } catch (err: any) {
            console.error('Submission error:', err);
            alert('Error: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.rpc('saas_update_restaurant_details', {
                p_restaurant_id: selectedRestaurant.id,
                p_name: restName,
                p_ruc: restRuc,
                p_business_name: businessName,
                p_legal_rep: legalRep,
                p_phone: phone,
                p_corp_email: corpEmail,
                p_address: mainAddress,
                p_admin_name: adminName,
                p_admin_email: adminEmail
            });
            if (error) throw error;

            setIsEditRestModalOpen(false);
            fetchRestaurants();
        } catch (err: any) {
            alert('Error: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchDetailedRestaurantData = async (restaurant: any) => {
        setSelectedRestaurant(restaurant);
        setRestName(restaurant.name);
        setRestRuc(restaurant.ruc || '');

        // Reset states
        setBusinessName('');
        setLegalRep('');
        setPhone('');
        setCorpEmail('');
        setMainAddress('');
        setAdminName('');
        setAdminEmail('');

        try {
            const { data, error } = await supabase.rpc('saas_get_restaurant_details', {
                p_restaurant_id: restaurant.id
            });
            if (error) throw error;

            if (data) {
                if (data.profile) {
                    setBusinessName(data.profile.business_name || '');
                    setRestRuc(data.profile.ruc || restaurant.ruc || '');
                    setLegalRep(data.profile.legal_representative || '');
                    setPhone(data.profile.phone || '');
                    setCorpEmail(data.profile.email || '');
                    setMainAddress(data.profile.main_address || '');
                }
                if (data.admin) {
                    setAdminName(data.admin.full_name || '');
                    setAdminEmail(data.admin.email || '');
                }
            }
        } catch (err) {
            console.error('Error fetching details:', err);
        }
    };

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.rpc('saas_create_user', {
                p_email: empEmail,
                p_password: empPass,
                p_full_name: empName,
                p_role: empRole,
                p_restaurant_id: selectedRestaurant.id,
                p_branch_id: empBranchId || null
            });
            if (error) throw error;

            // Check for business logic errors returned as jsonb
            if (data && data.success === false) {
                throw new Error(data.message || 'Error al crear el usuario');
            }

            setEmpName('');
            setEmpEmail('');
            setEmpPass('');
            setEmpBranchId('');
            alert('✅ Usuario creado correctamente');
            fetchRestaurantUsers(selectedRestaurant.id);
            fetchRestaurants(); // Update counts
        } catch (err: any) {
            console.error('Error creating employee:', err);
            alert('Error al crear usuario: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const { data, error } = await supabase.rpc('saas_toggle_user_status', {
                p_user_id: userId,
                p_status: !currentStatus
            });
            if (error) throw error;
            if (selectedRestaurant) fetchRestaurantUsers(selectedRestaurant.id);
        } catch (err) {
            console.error('Error toggling user status:', err);
        }
    };

    const resetUserPassword = async (userId: string) => {
        const newPass = prompt('Ingrese la nueva contraseña para el usuario:');
        if (!newPass) return;

        try {
            const { data, error } = await supabase.rpc('saas_reset_user_password', {
                p_user_id: userId,
                p_new_password: newPass
            });
            if (error) throw error;
            alert('Contraseña actualizada con éxito');
        } catch (err) {
            console.error('Error resetting password:', err);
            alert('Error al actualizar contraseña');
        }
    };

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.rpc('saas_update_user', {
                p_user_id: selectedUser.id,
                p_full_name: editEmpName,
                p_email: editEmpEmail,
                p_username: editEmpUsername,
                p_role: editEmpRole,
                p_branch_id: editEmpBranchId || null,
                p_password: editEmpPass || null
            });
            if (error) throw error;

            setIsEditUserModalOpen(false);
            fetchRestaurantUsers(selectedRestaurant.id);
            setEditEmpPass(''); // Clear password
        } catch (err: any) {
            console.error('Error updating employee:', err);
            alert('Error al actualizar: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase.rpc('saas_delete_user', { p_user_id: userId });
            if (error) throw error;
            if (selectedRestaurant) fetchRestaurantUsers(selectedRestaurant.id);
            fetchRestaurants();
        } catch (err: any) {
            alert('Error: ' + (err.message || 'Error desconocido'));
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in max-w-[1240px] mx-auto">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-primary">business_center</span>
                        Administración SaaS de Restaurantes
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Control integral de inquilinos, accesos y personal global.</p>
                </div>
                <button
                    onClick={() => {
                        setRestName('');
                        setRestRuc('');
                        setBusinessName('');
                        setLegalRep('');
                        setPhone('');
                        setCorpEmail('');
                        setMainAddress('');
                        setAdminName('');
                        setAdminEmail('');
                        setAdminPass('');
                        setIsCreateModalOpen(true);
                    }}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                    <span className="material-icons-round text-sm">add_business</span>
                    Registrar Nuevo Restaurante
                </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurante</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Usuarios</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Registro</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">Buscando comercios...</td></tr>
                        ) : restaurants.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No hay restaurantes en la plataforma.</td></tr>
                        ) : restaurants.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 group-hover:text-primary transition-colors">{r.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <span className="material-icons-round text-[10px]">fingerprint</span>
                                        {r.id}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-xs">
                                        {r.user_count}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 text-[9px] font-black rounded-full ${r.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {r.subscription_status === 'active' ? 'ACTIVO' : 'SUSPENDIDO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                    {new Date(r.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                fetchDetailedRestaurantData(r);
                                                setIsEditRestModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                            title="Editar Restaurante"
                                        >
                                            <span className="material-icons-round text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRestaurant(r);
                                                setIsUserModalOpen(true);
                                                fetchRestaurantUsers(r.id);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-primary bg-blue-50 border border-blue-100 hover:bg-primary hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                                        >
                                            <span className="material-icons-round text-sm">people</span>
                                            Usuarios
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal: CREAR RESTAURANTE */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nuevo Inquilino</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración Inicial</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>
                        <form onSubmit={handleCreateRestaurant} className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Comercial</label>
                                <input
                                    type="text"
                                    required
                                    value={restName}
                                    onChange={(e) => setRestName(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Nombre del Restaurante"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Credenciales del Dueño</p>
                                <div className="space-y-4">
                                    <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Nombre del Administrador" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Correo Electrónico" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    <input type="password" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Contraseña de Acceso" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 mt-2">
                                {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Provisionar Restaurante'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: EDITAR RESTAURANTE */}
            {isEditRestModalOpen && selectedRestaurant && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                        <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Restaurante</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración y Datos Corporativos</p>
                            </div>
                            <button onClick={() => setIsEditRestModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>
                        <form onSubmit={handleUpdateRestaurant} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            {/* Seccion 1: Datos Basicos */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Información General</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Comercial</label>
                                        <input type="text" required value={restName} onChange={(e) => setRestName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admin: Nombre Completo</label>
                                        <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admin: Email</label>
                                        <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                </div>
                            </div>

                            {/* Seccion 2: Datos Corporativos */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Datos Corporativos</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Razón Social / Nombre Empresa</label>
                                        <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" placeholder="Nombre legal de la empresa" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">RUC / ID Legal</label>
                                        <input type="text" value={restRuc} onChange={(e) => setRestRuc(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" placeholder="ID Fiscal" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Representante Legal</label>
                                        <input type="text" value={legalRep} onChange={(e) => setLegalRep(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" placeholder="Nombre completo" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Teléfono</label>
                                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Corporativo</label>
                                        <input type="email" value={corpEmail} onChange={(e) => setCorpEmail(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Dirección Matriz</label>
                                        <input type="text" value={mainAddress} onChange={(e) => setMainAddress(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-2 mt-4 shrink-0">
                                <span className="material-icons-round">save</span>
                                {isSubmitting ? 'Guardando...' : 'Guardar Información'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: GESTION DE USUARIOS (Lateral) */}
            {isUserModalOpen && selectedRestaurant && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-end">
                    <div className="bg-white h-full w-full max-w-4xl shadow-2xl flex flex-col animate-slide-in-right">
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedRestaurant.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] mt-1 uppercase">Gestión de Personal y Accesos</p>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400">
                                <span className="material-icons-round text-2xl">close</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                            {/* Form: Agregar Usuario */}
                            <section className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="material-icons-round text-primary text-sm">person_add</span>
                                    Vincular Nuevo Personal
                                </h4>
                                <form onSubmit={handleCreateEmployee} className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                                        <input type="text" required value={empName} onChange={(e) => setEmpName(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Rol / Cargo</label>
                                        <select value={empRole} onChange={(e) => setEmpRole(e.target.value as UserRole)} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-sm">
                                            <option value={UserRole.ADMIN}>Administrador (Dueño)</option>
                                            <option value={UserRole.KITCHEN}>Cocina</option>
                                            <option value={UserRole.WAITER}>Mesero</option>
                                            <option value={UserRole.CASHIER}>Cajero</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Sucursal Asignada</label>
                                        <select value={empBranchId} onChange={(e) => setEmpBranchId(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-sm">
                                            <option value="">Matriz Principal</option>
                                            {branches.filter(b => b.restaurantId === selectedRestaurant.id).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Acceso</label>
                                        <input type="email" required value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                                        <input type="password" required value={empPass} onChange={(e) => setEmpPass(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-sm" />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-black uppercase rounded-2xl col-span-2 mt-2 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                                        {isSubmitting ? 'Procesando...' : 'Registrar y Vincular'}
                                    </button>
                                </form>
                            </section>

                            {/* List: Usuarios Existentes (Rediseñado) */}
                            <section className="space-y-6">
                                <div className="flex justify-between items-end px-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Registrado</h4>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{restaurantUsers.length} total</span>
                                </div>

                                <div className="bg-white rounded-[32px] border border-slate-100 overflow-x-auto shadow-sm custom-scrollbar">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personal</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loadingUsers ? (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Cargando nómina...</td></tr>
                                            ) : restaurantUsers.length === 0 ? (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 text-xs">Sin registros de personal</td></tr>
                                            ) : restaurantUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-50 text-primary rounded-full flex items-center justify-center font-black text-xs">
                                                                {user.full_name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{user.full_name}</div>
                                                                <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight
                                                            ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' :
                                                                user.role === 'kitchen' ? 'bg-slate-100 text-slate-600' :
                                                                    user.role === 'waiter' ? 'bg-amber-50 text-amber-600' :
                                                                        'bg-blue-50 text-blue-600'}`}>
                                                            {user.role === 'admin' ? 'Administrador' :
                                                                user.role === 'kitchen' ? 'Cocina' :
                                                                    user.role === 'waiter' ? 'Mesero' : 'Cajero'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            {user.branches?.name || 'Matriz Principal'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 shadow-sm">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                                            <span className={`text-[10px] font-black uppercase ${user.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setEditEmpName(user.full_name || '');
                                                                    setEditEmpEmail(user.email || '');
                                                                    setEditEmpUsername(user.username || '');
                                                                    setEditEmpRole(user.role);
                                                                    setEditEmpBranchId(user.branch_id || '');
                                                                    setEditEmpPass('');
                                                                    setIsEditUserModalOpen(true);
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-blue-50 transition-all shadow-sm border border-slate-100 hover:border-blue-100"
                                                                title="Editar Perfil"
                                                            >
                                                                <span className="material-icons-round text-lg">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border border-slate-100
                                                                    ${user.is_active ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-100' : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100'}`}
                                                                title={user.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
                                                            >
                                                                <span className="material-icons-round text-lg">{user.is_active ? 'block' : 'check_circle'}</span>
                                                            </button>
                                                            {!user.is_active && (
                                                                <button
                                                                    onClick={() => deleteUser(user.id)}
                                                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-300 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm border border-slate-100"
                                                                    title="Eliminar Permanente"
                                                                >
                                                                    <span className="material-icons-round text-lg">delete_outline</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {isEditUserModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
                        <header className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Perfil</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración de Acceso</p>
                            </div>
                            <button onClick={() => setIsEditUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>
                        <form onSubmit={handleUpdateEmployee} className="p-10 space-y-8">
                            {/* Nombre Completo */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={editEmpName}
                                    onChange={(e) => setEditEmpName(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico (Login)</label>
                                    <input
                                        type="email"
                                        required
                                        value={editEmpEmail}
                                        onChange={(e) => setEditEmpEmail(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                                {/* Username (Ref) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario (Referencia)</label>
                                    <input
                                        type="text"
                                        value={editEmpUsername}
                                        onChange={(e) => setEditEmpUsername(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700"
                                        placeholder="Ej: Cocina test 3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña (Opcional)</label>
                                    <input
                                        type="password"
                                        value={editEmpPass}
                                        onChange={(e) => setEditEmpPass(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                {/* Sucursal */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sucursal</label>
                                    <select
                                        value={editEmpBranchId}
                                        onChange={(e) => setEditEmpBranchId(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1.5rem_center] bg-no-repeat"
                                    >
                                        <option value="">Matriz Principal</option>
                                        {branches.filter(b => b.restaurantId === selectedRestaurant.id).map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol de Usuario</label>
                                    <select
                                        value={editEmpRole}
                                        onChange={(e) => setEditEmpRole(e.target.value as UserRole)}
                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1.5rem_center] bg-no-repeat"
                                    >
                                        <option value={UserRole.ADMIN}>Administrador (Dueño)</option>
                                        <option value={UserRole.KITCHEN}>Cocina</option>
                                        <option value={UserRole.WAITER}>Mesero</option>
                                        <option value={UserRole.CASHIER}>Cajero</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between items-center gap-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setIsEditUserModalOpen(false)}
                                    className="px-8 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaasManagementView;
