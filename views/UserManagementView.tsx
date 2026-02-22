
import React, { useState, useEffect } from 'react';
import { User, UserRole, Order, Branch } from '../types';
import { supabase } from '../supabaseClient';
import { logActivity } from '../services/audit';

interface UserManagementViewProps {
    currentUser: User | null;
    branches?: Branch[];
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, branches = [] }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: UserRole.WAITER,
        branchId: ''
    });
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>(null); // For selected user metrics

    useEffect(() => {
        fetchUsers();

        // Realtime subscription
        const channel = supabase
            .channel('users-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                fetchUsers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const fetchUsers = async () => {
        if (!currentUser?.restaurantId) return;
        const controller = new AbortController();

        // Fetch users from the entire restaurant associated with the admin's restaurant_id
        // Join with branches to get the name
        const { data, error } = await supabase
            .from('users')
            .select('*, branches(name)')
            .eq('restaurant_id', currentUser.restaurantId)
            .neq('role', UserRole.ADMIN)
            .abortSignal(controller.signal)
            .order('full_name');

        if (data) {
            const formatted: User[] = data.map((u: any) => ({
                id: u.id,
                name: u.full_name,
                email: u.email,
                username: u.username,
                role: u.role as UserRole,
                isActive: u.is_active,
                branchId: u.branch_id,
                branchName: u.branches?.name // Map branch name
            }));
            setUsers(formatted);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        // ... (existing save logic needs to check branch selection if we allow changing it)
        // For now, let's keep it simple, or allow picking branch in modal?
        // The user verified "assign employees" via script, so editing might not be strictly required "right now" to change branch in UI
        // But preventing regression: existing logic uses currentUser.branchId for new users.
        // We might want to add Branch Selector in Modal later, but for now let's stick to the viewing requirement.

        e.preventDefault();
        // Fallback to currentUser.branchId if no specific branch selected (though we should enforce selection if branches > 0)
        const targetBranchId = formData.branchId || currentUser?.branchId;

        if (!targetBranchId) return alert('Debe seleccionar una sucursal');

        // ... rest of logic uses targetBranchId instead of currentUser.branchId
        // ...
        setLoading(true);

        try {
            const payload = {
                full_name: formData.name,
                email: formData.email,
                username: formData.username,
                role: formData.role,
                branch_id: targetBranchId,
                restaurant_id: currentUser?.restaurantId,
                is_active: true
            };

            if (editingUser) {
                const { error } = await supabase.from('users').update(payload).eq('id', editingUser.id);
                if (error) throw error;
                if (formData.password.trim()) {
                    const { error: pwError } = await supabase.rpc('update_staff_password', {
                        p_user_id: editingUser.id,
                        p_password: formData.password
                    });
                    if (pwError) throw pwError;
                }
                await logActivity(currentUser?.id || '', 'edit_user', 'UserMgmt', { id: editingUser.id, ...payload });
            } else {
                const { data, error } = await supabase.rpc('create_staff_user', {
                    p_name: formData.name,
                    p_username: formData.username,
                    p_password: formData.password,
                    p_pin: null,
                    p_role: formData.role,
                    p_branch_id: targetBranchId,
                    p_restaurant_id: currentUser?.restaurantId || null
                });

                if (error) throw error;
                await logActivity(currentUser?.id || '', 'create_user', 'UserMgmt', { username: formData.username, role: formData.role });
            }

            fetchUsers();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ... (toggleStatus, deleteUser, openModal, closeModal remain same)

    const toggleStatus = async (user: User) => {
        try {
            const newStatus = !user.isActive;
            const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);
            if (error) throw error;
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
            await logActivity(currentUser?.id || '', 'toggle_user_status', 'UserMgmt', { id: user.id, status: newStatus });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`¿Eliminar permanentemente a ${user.name}? Esta acción no se puede deshacer.`)) return;
        try {
            const { error } = await supabase.from('users').delete().eq('id', user.id);
            if (error) throw error;
            setUsers(prev => prev.filter(u => u.id !== user.id));
            await logActivity(currentUser?.id || '', 'delete_user', 'UserMgmt', { id: user.id, name: user.name });
        } catch (err) {
            console.error(err);
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email || '',
                username: user.username || '',
                password: '',
                role: user.role,
                branchId: user.branchId || currentUser?.branchId || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                role: UserRole.WAITER,
                branchId: currentUser?.branchId || ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };


    // Filtering & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [branchFilter, setBranchFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Matching the small list feel of the image

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = branchFilter === 'ALL' || user.branchId === branchFilter;
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        return matchesSearch && matchesBranch && matchesRole;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    return (
        <>
            <div className="p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-primary text-2xl">group</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h1>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">RESTOGESTIÓN V2.0 • Administra meseros, cajeros y permisos de acceso por sucursal.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-8 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center gap-2 text-sm"
                    >
                        <span className="material-icons-round text-[20px]">person_add</span> Nuevo Usuario
                    </button>
                </header>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o rol..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-600 font-medium"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={branchFilter}
                            onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="ALL">Todas las Sucursales</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="ALL">Todos los Roles</option>
                            <option value={UserRole.WAITER}>Mesero</option>
                            <option value={UserRole.CASHIER}>Cajero</option>
                            <option value={UserRole.KITCHEN}>Cocina</option>
                        </select>

                        <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                            <span className="material-icons-round text-lg">tune</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                                                {getInitials(u.name)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 tracking-tight">{u.name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === UserRole.WAITER ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            u.role === UserRole.KITCHEN ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {u.role === UserRole.WAITER ? 'Mesero' : u.role === UserRole.KITCHEN ? 'Cocina' : 'Cajero'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-slate-500">{u.branchName || 'Sin Asignar'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></span>
                                            <span className={`text-xs font-bold ${u.isActive ? 'text-slate-600' : 'text-slate-400 line-through decoration-slate-300'}`}>
                                                {u.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal(u)} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-lg">
                                                <span className="material-icons-round text-lg">edit</span>
                                            </button>
                                            <button onClick={() => toggleStatus(u)} className={`p-2 transition-colors rounded-lg ${u.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                                                <span className="material-icons-round text-lg">{u.isActive ? 'block' : 'check_circle'}</span>
                                            </button>
                                            {!u.isActive && (
                                                <button onClick={() => deleteUser(u)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <span className="material-icons-round text-lg">delete_forever</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <span className="material-icons-round text-slate-300 text-3xl">person_off</span>
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se encontraron empleados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Footer */}
                    <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                            Mostrando <span className="text-slate-900">{startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> de <span className="text-slate-900">{filteredUsers.length}</span> empleados
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${currentPage === page ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Modal Redesign */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {editingUser ? 'Detalles del Usuario' : 'Nuevo Usuario'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">
                                    Gestión de acceso para RESTOGESTIÓN V2.0
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                {/* Single column for full name */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300"
                                        placeholder="Ej. Juan Pérez"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Two columns for email and username */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Correo Electrónico (Login)
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            readOnly={!!editingUser}
                                            className={`w-full px-5 py-3.5 border rounded-2xl text-sm transition-all outline-none font-medium placeholder:text-slate-300 ${editingUser
                                                ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-50/50 border-slate-100 text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary'
                                                }`}
                                            placeholder="ej: cocina1@gmail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Usuario (Referencia)
                                        </label>
                                        <input
                                            type="text"
                                            readOnly={!!editingUser}
                                            placeholder="jperez_rest"
                                            className={`w-full px-5 py-3.5 border rounded-2xl text-sm transition-all outline-none font-medium placeholder:text-slate-300 ${editingUser
                                                ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-50/50 border-slate-100 text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary'
                                                }`}
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Two columns for password and PIN */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Contraseña {editingUser && '(Opcional)'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-medium text-slate-700"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Two columns for branch and role */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Sucursal
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-semibold text-slate-700 appearance-none cursor-pointer"
                                                value={formData.branchId}
                                                onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                            >
                                                <option value="" disabled>Seleccionar Sucursal</option>
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name} {b.isActive ? '' : '(Inactiva)'}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Rol de Usuario
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-semibold text-slate-700 appearance-none cursor-pointer"
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                            >
                                                <option value={UserRole.WAITER}>Mesero</option>
                                                <option value={UserRole.CASHIER}>Cajero</option>
                                                <option value={UserRole.KITCHEN}>Cocina</option>
                                            </select>
                                            <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-12 py-3.5 rounded-2xl shadow-xl shadow-blue-200/50 font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar Usuario'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementView;
